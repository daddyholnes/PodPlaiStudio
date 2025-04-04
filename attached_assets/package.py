import os
import zipfile
import datetime

def create_package():
    """Create a ZIP package of the project excluding sensitive files"""
    # Files and folders to exclude
    exclude_list = [
        '__pycache__',
        '.git',
        '.cache',
        '.upm',
        '.pythonlibs',
        '.local',
        'chat_history.txt',
        'uploads/',
        '.env'
    ]
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    zip_filename = f'multimodal_ai_assistant_{timestamp}.zip'
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add .gitkeep to uploads folder
        with open('uploads/.gitkeep', 'w') as f:
            pass
        
        # Write a README file
        with open('README.md', 'w') as f:
            f.write("""# Multimodal AI Assistant

An enhanced multimodal AI interface for users with neurological disorders, built on Flask and Gemini API.

## Features
- Multiple input types (text, image, audio, video, documents)
- Accessibility features for users with neurological disorders
- Responsive interface that works on all devices

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables:
   - GEMINI_API_KEY - Your Google Gemini API key
   - SESSION_SECRET - Any secret string for Flask sessions
3. Run the application: `python main.py`

## Usage
The web interface provides options to:
- Chat with AI via text
- Upload and analyze images
- Process audio, video, and document files
""")
            
        # Create requirements.txt
        with open('requirements.txt', 'w') as f:
            f.write("""flask
flask-cors
google-generativeai
pypdf2
gunicorn
psycopg2-binary
email-validator
flask-sqlalchemy
""")
        
        # Add all files to the ZIP
        for root, dirs, files in os.walk('.'):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_list and not d.startswith('.')]
            
            for file in files:
                # Skip excluded files
                if file in exclude_list or file == zip_filename:
                    continue
                
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)
    
    print(f"Package created: {zip_filename}")
    print(f"You can download this file from the Files panel in Replit.")
    return zip_filename

if __name__ == "__main__":
    create_package()