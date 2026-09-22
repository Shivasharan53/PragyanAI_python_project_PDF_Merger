from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
from PIL import Image
from io import BytesIO
from typing import List
import os


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="PragyanAI PDF Merger",
    description="Modern PDF and Image Merger",
    version="2.0.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "PragyanAI PDF Merger API is running",
        "version": "2.0.0"
    }


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ==========================================
# MERGE FILES
# ==========================================

@app.post("/merge")
async def merge_files(
    files: List[UploadFile] = File(...)
):

    # Check files
    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one file."
        )

    writer = PdfWriter()

    try:

        # Process files in the exact order
        # received from the frontend
        for file in files:

            filename = file.filename or "file"

            extension = os.path.splitext(
                filename
            )[1].lower()

            file_data = await file.read()

            if not file_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Empty file: {filename}"
                )

            # ==================================
            # PDF
            # ==================================

            if extension == ".pdf":

                pdf_file = BytesIO(file_data)

                reader = PdfReader(pdf_file)

                if len(reader.pages) == 0:
                    raise HTTPException(
                        status_code=400,
                        detail=f"PDF has no pages: {filename}"
                    )

                for page in reader.pages:
                    writer.add_page(page)

            # ==================================
            # IMAGE
            # ==================================

            elif extension in [
                ".jpg",
                ".jpeg",
                ".png"
            ]:

                image_file = BytesIO(file_data)

                try:
                    image = Image.open(image_file)
                    image.load()
                except Exception:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid image file: {filename}"
                    )

                if image.mode != "RGB":
                    image = image.convert("RGB")

                pdf_buffer = BytesIO()

                image.save(
                    pdf_buffer,
                    format="PDF"
                )

                pdf_buffer.seek(0)

                reader = PdfReader(pdf_buffer)

                for page in reader.pages:
                    writer.add_page(page)

            # ==================================
            # UNSUPPORTED FILE
            # ==================================

            else:

                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file: {filename}"
                )

        # ==================================
        # CHECK OUTPUT
        # ==================================

        if len(writer.pages) == 0:
            raise HTTPException(
                status_code=400,
                detail="No pages were added to the merged PDF."
            )

        # ==================================
        # CREATE OUTPUT PDF
        # ==================================

        output = BytesIO()

        writer.write(output)

        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                'attachment; filename="PragyanAI_Merged.pdf"'
            }
        )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Merge failed: {str(error)}"
        )

    finally:

        writer.close()
