from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter
from PIL import Image
from io import BytesIO
from typing import List
import os


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

    if not files:

        raise HTTPException(
            status_code=400,
            detail="Please upload at least one file."
        )


    writer = PdfWriter()


    try:

        for file in files:

            filename = file.filename or "file"

            extension = os.path.splitext(
                filename
            )[1].lower()


            file_data = await file.read()


            # ==================================
            # PDF
            # ==================================

            if extension == ".pdf":

                pdf_file = BytesIO(file_data)

                reader = PdfReader(pdf_file)


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

                image = Image.open(image_file)


                if image.mode != "RGB":

                    image = image.convert("RGB")


                pdf_buffer = BytesIO()


                image.save(
                    pdf_buffer,
                    format="PDF"
                )


                pdf_buffer.seek(0)


                reader = PdfReader(
                    pdf_buffer
                )


                for page in reader.pages:

                    writer.add_page(page)


            else:

                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file: {filename}"
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
                'inline; filename="PragyanAI_Merged.pdf"'
            }

        )


    except HTTPException:

        raise


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


    finally:

        writer.close()
