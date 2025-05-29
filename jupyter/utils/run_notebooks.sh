  #!/usr/bin/env bash
cd /app/notebooks

# Execute Python notebooks
jupyter nbconvert \
    --to notebook \
    --execute \
    --inplace \
    --kernel python3 \
    --ExecutePreprocessor.timeout=-1 \
    --allow-errors \
    /app/notebooks/101_*.ipynb

# Execute Deno notebooks  
jupyter nbconvert \
    --to notebook \
    --execute \
    --inplace \
    --kernel deno \
    --ExecutePreprocessor.timeout=-1 \
    --allow-errors \
    /app/notebooks/102_*.ipynb