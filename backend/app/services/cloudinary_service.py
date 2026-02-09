import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_file(file, folder="assignments", filename=None):
    """
    Uploads a file to Cloudinary.
    'file' can be a file-like object, a path, or a URL.
    """
    try:
        options = {
            "folder": f"olabs/{folder}",
            "resource_type": "auto",
            "use_filename": True,
            "unique_filename": True
        }
        
        # For 'raw' files like .docx, having the extension in the public_id 
        # is critical for browsers to recognize the file type upon download.
        if filename:
            options["public_id"] = filename

        result = cloudinary.uploader.upload(file, **options)
        
        # Add fl_attachment to the URL to force download with original filename
        url = result.get("secure_url")
        if url and "/upload/" in url:
            url = url.replace("/upload/", "/upload/fl_attachment/")

        return {
            "url": url,
            "public_id": result.get("public_id"),
            "original_name": result.get("original_filename")
        }
    except Exception as e:
        print(f"Cloudinary upload error: {e}")
        return None

def delete_file(public_id):
    """ Deletes a file from Cloudinary """
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        print(f"Cloudinary deletion error: {e}")
        return False
