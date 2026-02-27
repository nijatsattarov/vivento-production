"""
Email Service for Vivento Platform
Handles sending transactional emails via Resend API
"""
import os
import asyncio
import logging
import resend
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@myvivento.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://myvivento.com")

# Email Templates
def get_welcome_email_template(user_name: str) -> str:
    """Welcome email template for new registrations"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Vivento</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Rəqəmsal Dəvətnamə Platforması</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Xoş gəlmisiniz, {user_name}! 🎉</h2>
                                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                    Vivento ailəsinə qoşulduğunuz üçün təşəkkür edirik! Artıq gözəl rəqəmsal dəvətnamələr yaradıb, 
                                    sevdiklərinizlə paylaşa bilərsiniz.
                                </p>
                                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                    <strong>İlk 30 dəvətnaməniz tamamilə pulsuzdur!</strong>
                                </p>
                                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                                            <a href="{FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                                Panelə Keçin →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Features -->
                        <tr>
                            <td style="padding: 0 40px 40px 40px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                                            <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">NƏ EDƏ BİLƏRSİNİZ:</p>
                                            <p style="color: #4b5563; margin: 0 0 8px 0; font-size: 14px;">✓ 100+ hazır şablon arasından seçin</p>
                                            <p style="color: #4b5563; margin: 0 0 8px 0; font-size: 14px;">✓ Dəvətnamələrinizi fərdiləşdirin</p>
                                            <p style="color: #4b5563; margin: 0 0 8px 0; font-size: 14px;">✓ Qonaqların cavablarını izləyin</p>
                                            <p style="color: #4b5563; margin: 0; font-size: 14px;">✓ WhatsApp ilə asanlıqla paylaşın</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © {datetime.now().year} Vivento. Bütün hüquqlar qorunur.
                                </p>
                                <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                                    <a href="{FRONTEND_URL}" style="color: #6366f1; text-decoration: none;">myvivento.com</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_password_reset_email_template(user_name: str, reset_token: str) -> str:
    """Password reset email template"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Vivento</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Şifrə Yeniləmə 🔐</h2>
                                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                    Salam {user_name},
                                </p>
                                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                                    Hesabınız üçün şifrə yeniləmə sorğusu aldıq. Şifrənizi yeniləmək üçün 
                                    aşağıdakı düyməyə klikləyin:
                                </p>
                                <table cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                                            <a href="{reset_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                                Şifrəni Yenilə →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #9ca3af; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                                    Bu link 1 saat ərzində etibarlıdır. Əgər siz bu sorğunu göndərməmisinizsə, 
                                    bu emaili nəzərə almayın.
                                </p>
                                <p style="color: #9ca3af; line-height: 1.6; margin: 20px 0 0 0; font-size: 12px; word-break: break-all;">
                                    Link işləmirsə, bu URL-i brauzerə kopyalayın:<br>
                                    <span style="color: #6366f1;">{reset_link}</span>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © {datetime.now().year} Vivento. Bütün hüquqlar qorunur.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_payment_invoice_email_template(user_name: str, amount: float, new_balance: float, transaction_id: str) -> str:
    """Payment invoice email template"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Vivento</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Ödəniş Təsdiqi</p>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Ödəniş Uğurla Tamamlandı! ✅</h2>
                                <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                                    Salam {user_name}, balans artırma əməliyyatınız uğurla tamamlandı.
                                </p>
                                
                                <!-- Invoice Details -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                                            <p style="color: #6b7280; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">FAKTURA</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 20px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #6b7280; font-size: 14px;">Tarix:</span>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #1f2937; font-size: 14px; font-weight: 500;">{datetime.now().strftime('%d.%m.%Y %H:%M')}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #6b7280; font-size: 14px;">Əməliyyat ID:</span>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #1f2937; font-size: 14px; font-family: monospace;">{transaction_id}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #6b7280; font-size: 14px;">Ödəniş üsulu:</span>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #1f2937; font-size: 14px;">Bank kartı (Epoint)</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colspan="2" style="padding: 15px 0 0 0; border-top: 1px dashed #d1d5db; margin-top: 10px;"></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Ödənilən məbləğ:</span>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #10b981; font-size: 20px; font-weight: 700;">{amount:.2f} AZN</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #6b7280; font-size: 14px;">Yeni balans:</span>
                                                    </td>
                                                    <td style="padding: 8px 0; text-align: right;">
                                                        <span style="color: #1f2937; font-size: 16px; font-weight: 600;">{new_balance:.2f} AZN</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                                            <a href="{FRONTEND_URL}/dashboard" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                                                Panelə Keçin →
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
                                    Sualınız varsa, bizimlə əlaqə saxlayın.
                                </p>
                                <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                                    © {datetime.now().year} Vivento. Bütün hüquqlar qorunur.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Send email using Resend API (async, non-blocking)
    """
    if not resend.api_key:
        logger.error("RESEND_API_KEY not configured")
        return {"success": False, "error": "Email service not configured"}
    
    params = {
        "from": f"Vivento <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}, ID: {email_response.get('id')}")
        return {
            "success": True,
            "email_id": email_response.get("id"),
            "message": f"Email sent to {to_email}"
        }
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_welcome_email(to_email: str, user_name: str) -> dict:
    """Send welcome email to new user"""
    subject = "Vivento-ya Xoş Gəlmisiniz! 🎉"
    html_content = get_welcome_email_template(user_name)
    return await send_email(to_email, subject, html_content)


async def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> dict:
    """Send password reset email"""
    subject = "Şifrə Yeniləmə - Vivento"
    html_content = get_password_reset_email_template(user_name, reset_token)
    return await send_email(to_email, subject, html_content)


async def send_payment_invoice_email(to_email: str, user_name: str, amount: float, new_balance: float, transaction_id: str) -> dict:
    """Send payment invoice email"""
    subject = f"Ödəniş Təsdiqi - {amount:.2f} AZN - Vivento"
    html_content = get_payment_invoice_email_template(user_name, amount, new_balance, transaction_id)
    return await send_email(to_email, subject, html_content)
