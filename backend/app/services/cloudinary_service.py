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
    To preserve filename and extension, we can pass (filename, file) as a tuple.
    """
    try:
        # If we have a filename, wrap the file in a tuple so Cloudinary uploader
        # knows the filename and extension. This prevents 'stream' as the name.
        upload_data = file
        if filename:
            # If it's a file-like object (has 'read' method), read it as bytes
            # to ensure compatibility with Cloudinary's tuple format.
            if hasattr(file, "read"):
                # Seek to beginning just in case
                if hasattr(file, "seek"):
                    file.seek(0)
                upload_data = (filename, file.read())
            else:
                upload_data = (filename, file)

        options = {
            "folder": f"olabs/{folder}",
            "resource_type": "auto",
            "use_filename": True,
            "unique_filename": True
        }
        
        # public_id should not include extension for Cloudinary's internal ID,
        # but Cloudinary will append the extension to the secure_url if resource_type is 'raw'.
        if filename:
            # Strip extension for public_id to avoid double extension .pdf.pdf
            base_name = os.path.splitext(filename)[0]
            options["public_id"] = base_name

        result = cloudinary.uploader.upload(upload_data, **options)
        
        # Add fl_attachment to the URL to force download with original filename
        url = result.get("secure_url")
        if url and "/upload/" in url:
            url = url.replace("/upload/", "/upload/fl_attachment/")

        return {
            "url": url,
            "public_id": result.get("public_id"),
            "original_name": result.get("original_filename") or filename
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
