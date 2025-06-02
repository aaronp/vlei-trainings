  #!/usr/bin/env bash
cd /app/notebooks

# Execute Python notebooks
jupyter nbconvert \
    --to notebook \
    --execute \
    --inplace \
    --ExecutePreprocessor.timeout=-1 \
    /app/notebooks/101_*.ipynb

# Execute Deno notebooks  
jupyter nbconvert \
    --to notebook \
    --execute \
    --inplace \
    --ExecutePreprocessor.timeout=-1 \
    /app/notebooks/102_*.ipynb