"""
Epoint.az Payment Gateway Service
Handles payment creation, signature generation, and webhook verification
"""
import hashlib
import base64
import json
import logging
from typing import Dict, Any, Optional
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class EpointService:
    """Service for interacting with Epoint.az payment gateway"""
    
    def __init__(self):
        self.merchant_id = os.environ.get("EPOINT_MERCHANT_ID", "")
        self.public_key = os.environ.get("EPOINT_PUBLIC_KEY", "")
        self.private_key = os.environ.get("EPOINT_PRIVATE_KEY", "")
        self.base_url = "https://epoint.az"
        
    def generate_signature(self, data: str) -> str:
        """
        Generate SHA1 signature for Epoint request
        Formula: base64_encode(sha1(private_key + data + private_key))
        
        Args:
            data: Base64 encoded JSON string
            
        Returns:
            Base64 encoded signature
        """
        try:
            # Create signature string: private_key + data + private_key
            signature_string = f"{self.private_key}{data}{self.private_key}"
            
            # Generate SHA1 hash (binary mode)
            sha1_hash = hashlib.sha1(signature_string.encode('utf-8')).digest()
            
            # Base64 encode the result
            signature = base64.b64encode(sha1_hash).decode('utf-8')
            
            logger.info("Signature generated successfully")
            return signature
            
        except Exception as e:
            logger.error(f"Error generating signature: {str(e)}")
            raise
    
    def create_payment_request(
        self,
        order_id: str,
        amount: float,
        currency: str,
        description: str,
        language: str = "az"
    ) -> Dict[str, Any]:
        """
        Create payment request data for Epoint
        
        Args:
            order_id: Unique order identifier
            amount: Payment amount in AZN
            currency: Currency code (AZN)
            description: Payment description
            language: Payment page language (az, en, ru)
            
        Returns:
            Dictionary with 'data' and 'signature' for Epoint API
        """
        try:
            # Get backend URL for callbacks
            backend_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
            
            # Prepare payment data
            payment_data = {
                "public_key": self.public_key,
                "amount": str(amount),
                "currency": currency,
                "description": description,
                "order_id": order_id,
                "language": language
            }
            
            # Convert to JSON and base64 encode
            json_string = json.dumps(payment_data, ensure_ascii=False)
            data_encoded = base64.b64encode(json_string.encode('utf-8')).decode('utf-8')
            
            # Generate signature
            signature = self.generate_signature(data_encoded)
            
            logger.info(f"Payment request created for order: {order_id}")
            
            return {
                "data": data_encoded,
                "signature": signature,
                "checkout_url": f"{self.base_url}/api/1/checkout"
            }
            
        except Exception as e:
            logger.error(f"Error creating payment request: {str(e)}")
            raise
    
    def verify_callback_signature(self, data: str, signature: str) -> bool:
        """
        Verify the signature of a callback from Epoint
        
        Args:
            data: Base64 encoded data from callback
            signature: Signature from callback
            
        Returns:
            True if signature is valid
        """
        try:
            # Generate expected signature
            expected_signature = self.generate_signature(data)
            
            # Compare signatures
            is_valid = signature == expected_signature
            
            if is_valid:
                logger.info("Callback signature verified successfully")
            else:
                logger.warning("Invalid callback signature")
                
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying callback signature: {str(e)}")
            return False
    
    def decode_callback_data(self, data: str) -> Dict[str, Any]:
        """
        Decode base64 encoded callback data
        
        Args:
            data: Base64 encoded JSON string
            
        Returns:
            Decoded dictionary
        """
        try:
            # Base64 decode
            decoded_bytes = base64.b64decode(data)
            decoded_string = decoded_bytes.decode('utf-8')
            
            # Parse JSON
            callback_data = json.loads(decoded_string)
            
            logger.info("Callback data decoded successfully")
            return callback_data
            
        except Exception as e:
            logger.error(f"Error decoding callback data: {str(e)}")
            raise
    
    def get_payment_status_request(self, transaction_id: str) -> Dict[str, Any]:
        """
        Create request to check payment status
        
        Args:
            transaction_id: Epoint transaction ID
            
        Returns:
            Dictionary with 'data' and 'signature' for status check
        """
        try:
            # Prepare status check data
            status_data = {
                "public_key": self.public_key,
                "transaction": transaction_id
            }
            
            # Convert to JSON and base64 encode
            json_string = json.dumps(status_data, ensure_ascii=False)
            data_encoded = base64.b64encode(json_string.encode('utf-8')).decode('utf-8')
            
            # Generate signature
            signature = self.generate_signature(data_encoded)
            
            logger.info(f"Status check request created for transaction: {transaction_id}")
            
            return {
                "data": data_encoded,
                "signature": signature,
                "url": f"{self.base_url}/api/1/get-status"
            }
            
        except Exception as e:
            logger.error(f"Error creating status check request: {str(e)}")
            raise

# Create a global instance
epoint_service = EpointService()
