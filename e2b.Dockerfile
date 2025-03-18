# You can use most Debian-based base images
FROM e2bdev/code-interpreter:latest

RUN pip install numpy pandas matplotlib seaborn openpyxl plotly scipy

