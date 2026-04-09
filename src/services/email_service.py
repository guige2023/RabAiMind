"""
Email Service for PPT Sharing
Simple SMTP-based email sending for collaboration features
"""
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

_SMTP_HOST = os.getenv("SMTP_HOST", "")
_SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
_SMTP_USER = os.getenv("SMTP_USER", "")
_SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
_SMTP_FROM = os.getenv("SMTP_FROM", _SMTP_USER)


def is_email_configured() -> bool:
    return bool(_SMTP_HOST and _SMTP_USER and _SMTP_PASSWORD)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
) -> bool:
    """
    Send an email via SMTP.
    Returns True if sent successfully, False otherwise.
    """
    if not is_email_configured():
        logger.warning("SMTP not configured, email not sent")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = _SMTP_FROM
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(_SMTP_USER, _SMTP_PASSWORD)
            server.sendmail(_SMTP_FROM, [to_email], msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_ppt_share_email(
    to_email: str,
    from_name: str,
    ppt_title: str,
    share_url: str,
    message: str | None = None,
    primary_color: str = "#165DFF",
    secondary_color: str = "#0E42D2",
    logo_data: str = "",
    email_tagline: str = "",
    white_label: bool = False,
    use_branded_template: bool = True,
) -> bool:
    """
    Send a PPT sharing invitation email.
    Supports branded templates with custom colors, logo, and tagline.
    """
    subject = f"📄 {from_name} 邀请你查看演示文稿: {ppt_title}"

    # Parse hex colors for gradient
    primary = primary_color.lstrip('#') if primary_color.startswith('#') else primary_color
    secondary = secondary_color.lstrip('#') if secondary_color.startswith('#') else secondary_color

    # Build logo HTML (if provided)
    logo_html = ""
    if logo_data and use_branded_template:
        logo_html = f'<img src="{logo_data}" alt="Logo" style="max-height: 48px; max-width: 160px; object-fit: contain; margin-bottom: 12px;" />'

    # Build tagline
    tagline_html = ""
    if email_tagline and use_branded_template:
        tagline_html = f'<p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 8px 0 0;">{email_tagline}</p>'

    # White-label mode: hide RabAiMind reference
    if white_label:
        powered_by_html = ""
    else:
        powered_by_html = f'<p style="font-size: 11px; color: #aaa; text-align: center; margin-top: 24px;">由 <a href="https://rabai.com" style="color: #{primary}; text-decoration: none;">RabAiMind</a> 提供支持</p>'

    # Use branded or default template
    if use_branded_template:
        header_title = f"📄 {from_name} 分享演示文稿"
    else:
        header_title = "📄 演示文稿分享"
        primary = "165DFF"
        secondary = "0E42D2"

    html_body = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #{primary} 0%, #{secondary} 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
        {logo_html}
        <h1 style="color: white; margin: 0; font-size: 24px;">{header_title}</h1>
        {tagline_html}
      </div>
      <div style="background: #f8f9fa; padding: 32px; border-radius: 0 0 16px 16px; border: 1px solid #e0e0e0; border-top: none;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">
          <strong>{from_name}</strong> 邀请你查看演示文稿
        </p>
        <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #{primary};">
          <h2 style="margin: 0 0 12px; font-size: 20px; color: #1a1a1a;">{ppt_title}</h2>
          {f'<p style="color: #666; margin: 0; font-style: italic;">"{message}"</p>' if message else ''}
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="{share_url}" style="display: inline-block; background: linear-gradient(135deg, #{primary}, #{secondary}); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba({int(primary[:2], 16)},{int(primary[2:4], 16)},{int(primary[4:], 16)},0.3);">
            查看演示文稿 →
          </a>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 24px;">
          如果链接无法点击，请复制以下地址到浏览器打开：<br>
          <a href="{share_url}" style="color: #{primary}; word-break: break-all;">{share_url}</a>
        </p>
        {powered_by_html}
      </div>
    </body>
    </html>
    """

    text_body = f"""{from_name} 邀请你查看演示文稿: {ppt_title}

{ppt_title}
{message + chr(10) if message else ''}
点击链接查看: {share_url}
"""

    return send_email(to_email, subject, html_body, text_body)
