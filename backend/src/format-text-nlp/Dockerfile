FROM public.ecr.aws/lambda/python:3.11

# Set HuggingFace cache inside the image so the model is baked in
ENV TRANSFORMERS_CACHE=/var/task/model_cache
ENV HF_HOME=/var/task/model_cache
ENV TRANSFORMERS_OFFLINE=1
ENV HF_DATASETS_OFFLINE=1
ENV HF_HUB_OFFLINE=1

COPY requirements.txt .
# Install CPU-only PyTorch first to avoid CUDA wheels (~2.5 GB saved) and
# ensure numpy gets a pre-built binary wheel (no C compiler needed).
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the BERT model at build time (avoids cold-start downloads)
RUN python -c "from deepmultilingualpunctuation import PunctuationModel; PunctuationModel()"

COPY handler.py ${LAMBDA_TASK_ROOT}/

CMD ["handler.handler"]
