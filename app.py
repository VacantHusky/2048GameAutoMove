import json
from flask import Flask, request, render_template
import numpy as np
from model.ai import Ai
from settings import DevelopmentConfig

app = Flask(__name__, template_folder='./templates', static_folder='./static')
# 加载配置
app.config.from_object(DevelopmentConfig)

nmap = {0: 'U', 1: 'R', 2: 'D', 3: 'L'}
fmap = dict([val, key] for key, val in nmap.items())

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/ai', methods=['POST'])
def ai():
    cells = json.loads(request.form.get('cells'))
    # print(cells)
    li = [[0 for i in range(4)] for j in range(4)]
    for cell in cells:
        for c in cell:
            if c is not None:
                li[c['y']][c['x']] = c['value']
    li_np = np.array(li).astype(np.int32)
    print(li_np)
    f, k = Ai().get_next(li_np)
    print(f)
    return str(fmap[f])

if __name__ == '__main__':
    print(app.url_map)
    app.run()
