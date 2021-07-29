> **_NOTE:_**  💡The note content.


```python {cmd=true matplotlib=true numpy=true}
import os
import struct

import matplotlib.pyplot as plt
import numpy as np


def plot_heat_map(x, figure_no):
    plt.figure(figure_no)
    plt.pcolor(x)
    plt.colorbar()
    plt.show()


def gen_heat_graph(row_num, buf):
    acc = 0
    red = int(len(buf) / 2)
    redmap = []
    for i in range(int(len(buf) / 2)):
        accByte = buf[acc + i]
        redByte = buf[red + i]
        j = 8
        while j > 0:
            j = j - 1
            accBit = accByte % 2
            redBit = redByte % 2
            redByte = int(redByte / 2)
            accByte = int(accByte / 2)
            if not accBit:
                if redBit:
                    redmap.append(0)
                else:
                    redmap.append(1)
            else:
                redmap.append(2)
    arr = np.array_split(redmap, row_num)
    print(arr)
    plot_heat_map(arr, 2)


if __name__ == '__main__':
    filepath = r'C:\Users\雷克伦\Desktop\20000365f.redmap'
    redMap = open(filepath, 'rb')
    size = os.path.getsize(filepath)
    buf = []
    for i in range(size):
        data = redMap.read(1)
        num = struct.unpack('B', data)
        buf.append(num[0])
    # row_num = 1, 2, 4, 8...
    gen_heat_graph(1, buf)
    redMap.close()
```



> **_NOTE:_**  💡The note content.