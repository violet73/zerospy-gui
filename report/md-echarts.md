> **_NOTE:_**  💡The note content.


```python {cmd=true matplotlib=true numpy=true}
import numpy as np
import matplotlib.pyplot as plt

def plot_heat_map(x,figure_no):
    plt.figure(figure_no)
    plt.pcolor(x)
    # plt.colorbar()
    plt.show()

if __name__=='__main__':
    plt.close('all')
    x=[[0,0,0,1,1,0,1,0,1,0],[0,1,0,1,0,0,0,0,0,0]]
    plot_heat_map(x,2)
```



> **_NOTE:_**  💡The note content.