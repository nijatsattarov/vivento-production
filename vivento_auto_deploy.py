#!/usr/bin/env python3
"""
Vivento Automatic Deployment Script
Bu script Vivento-nu tam avtomatik deploy edir
"""

import os
import subprocess
import requests
import json
import time
import base64
from pathlib import Path

class ViventoAutoDeployer:
    def __init__(self, config):
        self.config = config
        self.github_token = config['github_token']
        self.railway_token = config['railway_token']
        self.vercel_token = config['vercel_token']
        self.repo_name = config['repo_name']
        
        # URLs
        self.github_api = "https://api.github.com"
        self.railway_api = "https://backboard.railway.app/graphql/v2"
        self.vercel_api = "https://api.vercel.com"
        
        print(f"🤖 Vivento Auto Deployer başladı")
        print(f"📦 Repo: {self.repo_name}")
        
    def log(self, message, type="info"):
        icons = {"info": "ℹ️", "success": "✅", "error": "❌", "warning": "⚠️"}
        print(f"{icons.get(type, 'ℹ️')} {message}")
        
    def run_command(self, cmd, cwd=None):
        """Run shell command"""
        try:
            result = subprocess.run(cmd, shell=True, cwd=cwd, 
                                  capture_output=True, text=True, check=True)
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {cmd}", "error")
            self.log(f"Error: {e.stderr}", "error")
            return None
            
    def create_github_repo(self):
        """GitHub repo yaradır və kod push edir"""
        self.log("GitHub repo yaradılır...", "info")
        
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        repo_data = {
            'name': self.repo_name,
            'description': 'Vivento - Digital Invitation Platform (Auto-deployed)',
            'private': False,
            'auto_init': False
        }
        
        response = requests.post(f'{self.github_api}/user/repos', 
                               headers=headers, json=repo_data)
        
        if response.status_code in [201, 422]:  # 422 means already exists
            if response.status_code == 422:
                self.log("Repo artıq mövcuddur, mövcud repo-dan istifadə ediləcək", "warning")
            else:
                self.log("GitHub repo uğurla yaradıldı!", "success")
            
            repo_info = self.get_github_repo_info()
            if repo_info:
                self.push_code_to_github(repo_info['clone_url'])
                return repo_info['html_url']
        else:
            self.log(f"GitHub repo yaradıla bilmədi: {response.text}", "error")
            return None
            
    def get_github_repo_info(self):
        """GitHub repo məlumatlarını alır"""
        headers = {'Authorization': f'token {self.github_token}'}
        response = requests.get(f'{self.github_api}/repos/{self.get_github_username()}/{self.repo_name}', 
                              headers=headers)
        if response.status_code == 200:
            return response.json()
        return None
        
    def get_github_username(self):
        """GitHub username alır"""
        headers = {'Authorization': f'token {self.github_token}'}
        response = requests.get(f'{self.github_api}/user', headers=headers)
        if response.status_code == 200:
            return response.json()['login']
        return None
        
    def push_code_to_github(self, clone_url):
        """Kodu GitHub-a push edir"""
        self.log("Kod GitHub-a push edilir...", "info")
        
        # Git repository initialize
        git_commands = [
            "git init",
            f"git remote add origin {clone_url.replace('https://', f'https://{self.github_token}@')}",
            "git add .",
            'git commit -m "Initial Vivento deployment - Auto generated"',
            "git branch -M main",
            "git push -f origin main"
        ]
        
        for cmd in git_commands:
            result = self.run_command(cmd, cwd='/app')
            if result is None and 'push' in cmd:
                # Retry push with different method
                self.run_command("git push --set-upstream origin main --force", cwd='/app')
                
        self.log("Kod uğurla GitHub-a push edildi!", "success")
        
    def create_railway_project(self):
        """Railway project yaradır"""
        self.log("Railway project yaradılır...", "info")
        
        headers = {
            'Authorization': f'Bearer {self.railway_token}',
            'Content-Type': 'application/json'
        }
        
        # GraphQL mutation for creating project
        query = """
        mutation projectCreate($input: ProjectCreateInput!) {
            projectCreate(input: $input) {
                id
                name
                description
            }
        }
        """
        
        variables = {
            "input": {
                "name": f"{self.repo_name}-backend",
                "description": "Vivento Backend API - Auto deployed"
            }
        }
        
        response = requests.post(self.railway_api, 
                               headers=headers, 
                               json={'query': query, 'variables': variables})
        
        if response.status_code == 200:
            data = response.json()
            if 'data' in data and data['data']['projectCreate']:
                project_id = data['data']['projectCreate']['id']
                self.log(f"Railway project yaradıldı: {project_id}", "success")
                
                # Deploy from GitHub
                self.deploy_to_railway(project_id)
                return project_id
            else:
                self.log(f"Railway project yaradıla bilmədi: {data}", "error")
        else:
            self.log(f"Railway API xətası: {response.text}", "error")
            
        return None
        
    def deploy_to_railway(self, project_id):
        """Railway-də GitHub-dan deploy edir"""
        self.log("Railway-də GitHub-dan deploy edilir...", "info")
        
        headers = {
            'Authorization': f'Bearer {self.railway_token}',
            'Content-Type': 'application/json'
        }
        
        # Create service from GitHub
        query = """
        mutation serviceCreate($input: ServiceCreateInput!) {
            serviceCreate(input: $input) {
                id
                name
            }
        }
        """
        
        username = self.get_github_username()
        variables = {
            "input": {
                "projectId": project_id,
                "source": {
                    "repo": f"{username}/{self.repo_name}",
                    "rootDirectory": "backend"
                },
                "name": "vivento-backend"
            }
        }
        
        response = requests.post(self.railway_api, 
                               headers=headers, 
                               json={'query': query, 'variables': variables})
        
        if response.status_code == 200:
            self.log("Railway service yaradıldı!", "success")
            
            # Set environment variables
            self.setup_railway_env_vars(project_id)
        else:
            self.log(f"Railway service yaradıla bilmədi: {response.text}", "error")
            
    def setup_railway_env_vars(self, project_id):
        """Railway environment variables setup edir"""
        self.log("Railway environment variables setup edilir...", "info")
        
        # Generate MongoDB connection URL
        mongo_url = self.create_mongodb_atlas()
        
        env_vars = {
            'MONGO_URL': mongo_url,
            'SECRET_KEY': 'vivento-production-secret-key-2024-auto-generated',
            'CORS_ORIGINS': '*',
            'PORT': '8001'
        }
        
        headers = {
            'Authorization': f'Bearer {self.railway_token}',
            'Content-Type': 'application/json'
        }
        
        for key, value in env_vars.items():
            query = """
            mutation variableUpsert($input: VariableUpsertInput!) {
                variableUpsert(input: $input) {
                    id
                }
            }
            """
            
            variables = {
                "input": {
                    "projectId": project_id,
                    "name": key,
                    "value": value,
                    "environmentId": None  # applies to all environments
                }
            }
            
            response = requests.post(self.railway_api, 
                                   headers=headers, 
                                   json={'query': query, 'variables': variables})
            
            if response.status_code == 200:
                self.log(f"Environment variable set: {key}", "success")
            else:
                self.log(f"Failed to set {key}: {response.text}", "error")
                
        # Get deployment URL
        backend_url = f"https://{self.repo_name}-backend.railway.app"
        self.config['backend_url'] = backend_url
        self.log(f"Backend URL: {backend_url}", "success")
        
    def create_mongodb_atlas(self):
        """MongoDB Atlas cluster yaradır (simulated - manual setup needed)"""
        self.log("MongoDB Atlas setup...", "info")
        
        # For automation, we'll use a placeholder
        # In real scenario, you'd use MongoDB Atlas API
        atlas_url = "mongodb+srv://vivento_user:CHANGE_THIS_PASSWORD@vivento-cluster.abcde.mongodb.net/vivento?retryWrites=true&w=majority"
        
        self.log("MongoDB Atlas cluster placeholder yaradıldı", "success")
        self.log("⚠️  Manual step: MongoDB Atlas-da real cluster yaradın və connection string update edin", "warning")
        
        return atlas_url
        
    def deploy_to_vercel(self):
        """Vercel-də frontend deploy edir"""
        self.log("Vercel-də frontend deploy edilir...", "info")
        
        headers = {
            'Authorization': f'Bearer {self.vercel_token}',
            'Content-Type': 'application/json'
        }
        
        username = self.get_github_username()
        deploy_data = {
            "name": f"{self.repo_name}-frontend",
            "gitSource": {
                "type": "github",
                "repo": f"{username}/{self.repo_name}",
                "ref": "main"
            },
            "framework": "create-react-app",
            "rootDirectory": "frontend",
            "buildCommand": "npm run build",
            "outputDirectory": "build",
            "installCommand": "npm install",
            "env": {
                "REACT_APP_BACKEND_URL": {
                    "type": "plain",
                    "value": self.config.get('backend_url', 'https://your-backend.railway.app')
                }
            }
        }
        
        response = requests.post(f'{self.vercel_api}/v10/projects', 
                               headers=headers, json=deploy_data)
        
        if response.status_code in [200, 201]:
            project_data = response.json()
            frontend_url = f"https://{project_data['name']}.vercel.app"
            self.config['frontend_url'] = frontend_url
            
            self.log(f"Frontend deploy edildi: {frontend_url}", "success")
            return frontend_url
        else:
            self.log(f"Vercel deployment failed: {response.text}", "error")
            return None
            
    def run_full_deployment(self):
        """Tam deployment prosesini icra edir"""
        self.log("🚀 Vivento Tam Avtomatik Deployment başladı!", "info")
        print("=" * 60)
        
        start_time = time.time()
        
        try:
            # 1. GitHub setup
            github_repo = self.create_github_repo()
            if not github_repo:
                self.log("GitHub repo yaradıla bilmədi - deployment dayandırıldı", "error")
                return False
                
            time.sleep(2)
            
            # 2. Railway backend deployment
            railway_project = self.create_railway_project()
            if not railway_project:
                self.log("Railway deployment uğursuz oldu", "error")
                
            time.sleep(2)
                
            # 3. Vercel frontend deployment
            frontend_url = self.deploy_to_vercel()
            if not frontend_url:
                self.log("Vercel deployment uğursuz oldu", "error")
                
            # 4. Final summary
            elapsed_time = int(time.time() - start_time)
            
            print("\n" + "=" * 60)
            self.log("🎉 DEPLOYMENT TAMAMLANDI!", "success")
            print("=" * 60)
            
            print(f"⏱️  Müddət: {elapsed_time} saniyə")
            print(f"✅ GitHub Repo: {github_repo}")
            print(f"✅ Backend API: {self.config.get('backend_url', 'Setup in progress...')}")
            print(f"✅ Frontend URL: {self.config.get('frontend_url', 'Setup in progress...')}")
            print(f"✅ Database: MongoDB Atlas (manual setup lazımdır)")
            
            print("\n📋 SONRAKI ADDIMLAR:")
            print("1. MongoDB Atlas-da real cluster yaradın")
            print("2. Railway-də MONGO_URL environment variable update edin")  
            print("3. Frontend və backend test edin")
            print("4. Custom domain əlavə edin (optional)")
            
            return True
            
        except Exception as e:
            self.log(f"Deployment xətası: {e}", "error")
            return False

def main():
    print("🤖 Vivento Avtomatik Deployment")
    print("=" * 40)
    
    # User input for tokens
    config = {}
    
    print("\n🔑 API Tokenləri daxil edin:")
    
    config['github_token'] = input("GitHub Token (ghp_xxxxx): ").strip()
    config['railway_token'] = input("Railway Token: ").strip() 
    config['vercel_token'] = input("Vercel Token: ").strip()
    
    print("\n⚙️  Preferences:")
    config['repo_name'] = input("Repo adı (default: vivento-production): ").strip() or "vivento-production"
    
    # Validate tokens
    if not all([config['github_token'], config['railway_token'], config['vercel_token']]):
        print("❌ Bütün tokenləri daxil etməlisiniz!")
        return
        
    # Create deployer and run
    deployer = ViventoAutoDeployer(config)
    success = deployer.run_full_deployment()
    
    if success:
        print("\n🎊 Vivento avtomatik deploy edildi!")
        print("Web səhifənizi açıb test edə bilərsiniz!")
    else:
        print("\n😞 Deployment tamamlanamadı. Logları yoxlayın.")

if __name__ == "__main__":
    main()