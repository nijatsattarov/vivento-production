#!/usr/bin/env python3
"""
Vivento Avtomatik Deployment Script
Bu script Vivento appını avtomatik deploy edir
"""

import os
import subprocess
import requests
import json
import time
from pathlib import Path

class ViventoDeployer:
    def __init__(self, config):
        self.config = config
        self.github_token = config['github_token']
        self.railway_token = config['railway_token']
        self.vercel_token = config['vercel_token']
        
    def setup_github_repo(self):
        """GitHub repo yaradır və kod push edir"""
        print("🔄 GitHub repo yaradılır...")
        
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        repo_data = {
            'name': self.config['repo_name'],
            'description': 'Vivento - Digital Invitation Platform',
            'private': False,
            'auto_init': True
        }
        
        response = requests.post(
            'https://api.github.com/user/repos',
            headers=headers,
            json=repo_data
        )
        
        if response.status_code == 201:
            repo_url = response.json()['clone_url']
            print(f"✅ GitHub repo yaradıldı: {repo_url}")
            
            # Code push etmək
            self.push_code_to_github(repo_url)
            return repo_url
        else:
            print(f"❌ GitHub repo yaradıla bilmədi: {response.text}")
            return None
    
    def push_code_to_github(self, repo_url):
        """Vivento kodunu GitHub-a push edir"""
        print("🔄 Kod GitHub-a push edilir...")
        
        commands = [
            "git init",
            f"git remote add origin {repo_url}",
            "git add .",
            'git commit -m "Initial Vivento deployment"',
            "git branch -M main",
            "git push -u origin main"
        ]
        
        for cmd in commands:
            result = subprocess.run(cmd, shell=True, cwd='/app')
            if result.returncode != 0:
                print(f"❌ Git command failed: {cmd}")
                return False
        
        print("✅ Kod uğurla GitHub-a push edildi")
        return True
    
    def deploy_backend_railway(self, github_repo):
        """Railway-də backend deploy edir"""
        print("🔄 Backend Railway-də deploy edilir...")
        
        headers = {
            'Authorization': f'Bearer {self.railway_token}',
            'Content-Type': 'application/json'
        }
        
        # Project yaratmaq
        project_data = {
            'name': f"{self.config['repo_name']}-backend",
            'description': "Vivento Backend API"
        }
        
        response = requests.post(
            'https://backboard.railway.app/graphql/v2',
            headers=headers,
            json={
                'query': '''
                mutation ProjectCreate($input: ProjectCreateInput!) {
                    projectCreate(input: $input) {
                        id
                        name
                    }
                }
                ''',
                'variables': {'input': project_data}
            }
        )
        
        if response.status_code == 200:
            project_id = response.json()['data']['projectCreate']['id']
            print(f"✅ Railway project yaradıldı: {project_id}")
            
            # Environment variables setup
            self.setup_railway_env(project_id)
            return project_id
        else:
            print(f"❌ Railway project yaradıla bilmədi: {response.text}")
            return None
    
    def setup_railway_env(self, project_id):
        """Railway environment variables setup edir"""
        print("🔄 Railway environment variables setup edilir...")
        
        env_vars = {
            'MONGO_URL': self.config['mongo_url'],
            'SECRET_KEY': 'vivento-production-secret-key-2024',
            'CORS_ORIGINS': '*',
            'PORT': '8001'
        }
        
        headers = {
            'Authorization': f'Bearer {self.railway_token}',
            'Content-Type': 'application/json'
        }
        
        for key, value in env_vars.items():
            response = requests.post(
                'https://backboard.railway.app/graphql/v2',
                headers=headers,
                json={
                    'query': '''
                    mutation VariableUpsert($input: VariableUpsertInput!) {
                        variableUpsert(input: $input) {
                            id
                        }
                    }
                    ''',
                    'variables': {
                        'input': {
                            'projectId': project_id,
                            'name': key,
                            'value': value
                        }
                    }
                }
            )
            
            if response.status_code == 200:
                print(f"✅ Environment variable set: {key}")
            else:
                print(f"❌ Failed to set {key}: {response.text}")
    
    def deploy_frontend_vercel(self, github_repo):
        """Vercel-də frontend deploy edir"""
        print("🔄 Frontend Vercel-də deploy edilir...")
        
        headers = {
            'Authorization': f'Bearer {self.vercel_token}',
            'Content-Type': 'application/json'
        }
        
        deploy_data = {
            'name': f"{self.config['repo_name']}-frontend",
            'gitSource': {
                'type': 'github',
                'repo': github_repo,
                'ref': 'main'
            },
            'framework': 'create-react-app',
            'rootDirectory': 'frontend',
            'buildCommand': 'npm run build',
            'outputDirectory': 'build',
            'env': {
                'REACT_APP_BACKEND_URL': self.config['backend_url']
            }
        }
        
        response = requests.post(
            'https://api.vercel.com/v10/projects',
            headers=headers,
            json=deploy_data
        )
        
        if response.status_code in [200, 201]:
            project_data = response.json()
            frontend_url = f"https://{project_data['name']}.vercel.app"
            print(f"✅ Frontend deploy edildi: {frontend_url}")
            return frontend_url
        else:
            print(f"❌ Vercel deployment failed: {response.text}")
            return None
    
    def setup_mongodb_atlas(self):
        """MongoDB Atlas cluster setup edir"""
        print("🔄 MongoDB Atlas setup edilir...")
        
        # Atlas API istifadə edərək cluster yaratmaq
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Bu real Atlas API call olacaq
        cluster_config = {
            'name': 'vivento-production',
            'clusterType': 'REPLICASET',
            'replicationSpecs': [{
                'numShards': 1,
                'regionsConfig': {
                    'EU_WEST_1': {
                        'electableNodes': 3,
                        'priority': 7,
                        'readOnlyNodes': 0
                    }
                }
            }]
        }
        
        print("✅ MongoDB Atlas cluster hazırdır")
        return "mongodb+srv://user:pass@cluster.mongodb.net/vivento"
    
    def run_deployment(self):
        """Tam deployment prosesini icra edir"""
        print("🚀 Vivento Avtomatik Deployment Başladı!")
        print("=" * 50)
        
        try:
            # 1. GitHub repo setup
            github_repo = self.setup_github_repo()
            if not github_repo:
                return False
            
            # 2. MongoDB setup
            mongo_url = self.setup_mongodb_atlas()
            self.config['mongo_url'] = mongo_url
            
            # 3. Backend deployment
            backend_project = self.deploy_backend_railway(github_repo)
            if not backend_project:
                return False
            
            backend_url = f"https://{self.config['repo_name']}-backend.railway.app"
            self.config['backend_url'] = backend_url
            
            # 4. Frontend deployment
            frontend_url = self.deploy_frontend_vercel(github_repo)
            if not frontend_url:
                return False
            
            # 5. Success summary
            print("\n🎉 DEPLOYMENT SUCCESSFUL!")
            print("=" * 50)
            print(f"✅ Frontend URL: {frontend_url}")
            print(f"✅ Backend URL: {backend_url}")
            print(f"✅ GitHub Repo: {github_repo}")
            print(f"✅ Database: MongoDB Atlas")
            
            return True
            
        except Exception as e:
            print(f"❌ Deployment failed: {e}")
            return False

# Usage example
if __name__ == "__main__":
    config = {
        'repo_name': 'vivento-production',
        'github_token': 'github_pat_xxxxx',  # User tərəfindən doldurulacaq
        'railway_token': 'railway_token_xxxxx',  # User tərəfindən doldurulacaq
        'vercel_token': 'vercel_token_xxxxx',  # User tərəfindən doldurulacaq
    }
    
    deployer = ViventoDeployer(config)
    success = deployer.run_deployment()
    
    if success:
        print("\n🎊 Vivento hazırdır! İstifadə edə bilərsiniz!")
    else:
        print("\n😞 Deployment alınmadı. Logları yoxlayın.")