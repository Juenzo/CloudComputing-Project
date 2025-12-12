import sys
import os
import multiprocessing

app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

max_requests = 1000
max_requests_jitter = 50
log_file = "-"
bind = "0.0.0.0"
timeout = 230
num_cpus = multiprocessing.cpu_count()
workers = (num_cpus * 2) + 1
worker_class = "uvicorn.workers.UvicornWorker"
