import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { openStdin } from 'process';
import { dirname } from 'path';
type Dict = {[k:string]: any};
const lklpath: string = "C:/Users/雷克伦/desktop/三下/vscode-cct/zerospy-gui/report/";
const yxypath:string = "/Users/yxy/Desktop/GUI/zerospy-gui/report/";

export class ReportJsonToMd {
    reportJson:Dict;
    threshold:number;
    reportPath:string;

    constructor(private reportRoot: string, threshold: number) {
        this.threshold = threshold === undefined ? 30:threshold;
        // console.log(this.threshold);
        // console.log(reportRoot);
        this.reportPath = dirname(reportRoot) + path.sep + 'report' + path.sep;
        if (!fs.existsSync(this.reportPath)) {
            fs.mkdirSync(this.reportPath);
        }
        // console.log(this.reportPath);
        
        this.reportJson = JSON.parse(fs.readFileSync(reportRoot, 'utf-8'));
	}

    genMetricOverview() {
        // let reportOverview = fs.createWriteStream('abspath/to/reportOverview.md', {
        //     flags:'w'
        // });
        let reportOverview = fs.createWriteStream(this.reportPath + 'reportOverview.md', {
            flags:'w'
        });
        reportOverview.write('## Metric Overview' + os.EOL);
        let metricOverview:Dict = this.reportJson['Metric Overview'];
        let threadNum:number = parseInt(metricOverview['Thread Num']);
        this.genMetricOverviewInteger(metricOverview['Total Integer Redundant Bytes'], threadNum, reportOverview);
        this.genMetricOverviewFloatingPoint(metricOverview['Total Floating Point Redundant Bytes'], threadNum, reportOverview);
        if(metricOverview['DC']) {
            this.genThreadDetailedMetrics(true);
        } else {
            this.genThreadDetailedMetrics(false);
        }
    }

    genMetricOverviewInteger(metricOverviewInteger:Dict, threadNum:number, reportOverview:fs.WriteStream) {
        let rate = metricOverviewInteger['rate'];
        let fraction = metricOverviewInteger['fraction'];
        reportOverview.write('<details><summary>Total Integer Redundant Bytes: ' + rate +' % ( ' + fraction + ' )</summary><blockquote>' + os.EOL);
        for(let i = 0; i < threadNum ; i++) {
            let threadData = metricOverviewInteger['Thread ' + i];
            reportOverview.write('Thread ' + i +': Total Integer Redundant Bytes: ' + threadData['rate'] + ' % (' + threadData['fraction'] + ') <a href="' + threadData['detail'] +'" title="detail">detail</a></br>');
        }
        reportOverview.write('</blockquote></details>' + os.EOL);
    }

    genMetricOverviewFloatingPoint(metricOverviewFloatingPoint:Dict, threadNum:number, reportOverview:fs.WriteStream) {
        let rate = metricOverviewFloatingPoint['rate'];
        let fraction = metricOverviewFloatingPoint['fraction'];
        reportOverview.write('<details><summary>Total Floating Point Redundant Bytes: ' + rate +' % ( ' + fraction + ' )</summary><blockquote>' + os.EOL);
        for(let i = 0; i < threadNum ; i++) {
            let threadData = metricOverviewFloatingPoint['Thread ' + i];
            reportOverview.write('Thread ' + i +': Total Floating Point Redundant Bytes: ' + threadData['rate'] + ' % (' + threadData['fraction'] + ') <a href="' + threadData['detail'] +'" title="detail">detail</a></br>');
        }
        reportOverview.write('</blockquote></details>' + os.EOL);
    }

    genThreadDetailedMetrics(isDC:boolean) {
        let threadNum:number = parseInt(this.reportJson['Metric Overview']['Thread Num']);
        if(isDC) {
            this.genThreadDetailedDataCentricMetrics(threadNum);
            return;
        }
        this.genThreadDetailedCodeCentricMetrics(threadNum);
    } 

    genThreadDetailedCodeCentricMetrics(threadNum:number) {
        for(let i = 0; i < threadNum ; i++) {
            let reportDetail = fs.createWriteStream(this.reportPath + 'thread' + i + 'CCDetail.md', {
                flags:'w'
            });
            reportDetail.write('## Thread ' + i + ' Detailed Metrics (Code Centric)' + os.EOL);
            let threadDetailedCodeCentricMetrics = this.reportJson['Thread ' + i +' Detailed Metrics']['Code Centric'];
            let integerInfo = threadDetailedCodeCentricMetrics['Integer Redundant Info'];
            let floatingPointInfo = threadDetailedCodeCentricMetrics['Floating Point Redundant Info'];
            this.genCodeCentricIntegerInfo(integerInfo, reportDetail);
            this.genCodeCentricFloatingPoint(floatingPointInfo, reportDetail);
        }
    }

    // return true if 仅低1/2/4位不为零且都⼩于<AccessLen> need to print warning info
    // return false: no need to print warning info
    handleCodeCentricIntegerRedMap(redMap:string):Boolean {
        let accessLen = redMap.substring(redMap.lastIndexOf('[') + 1, redMap.length - 1);
        // console.log(accessLen);

        let redmap = redMap.substring(redMap.indexOf(']') + 1, redMap.lastIndexOf(' '));
        // console.log(redmap);

        let byteArr = redmap.split(' ');
        // console.log(byteArr);

        // case1: xx 00 00 .. 00 && 1 < accesslen

        // case2: xx xx 00 .. 00 && 2 < accesslen

        // case4: xx xx xx xx .. 00 && 4 < accesslen
        
        if(byteArr.length > 2) {
            let flags:Boolean = true;
            for(let i = 2;i < byteArr.length;i++) {
                if(byteArr[i] !== '00') {
                    flags = false;
                    break;
                }
            }
            return flags;
        }
        return false;
    }

    genCodeCentricIntegerInfo(integerInfo:[], reportDetail:fs.WriteStream) {
        let infoNum = integerInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Integer Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = integerInfo[i];
            let num = String(threadInfo['Fully Redundant Zero']).match(/\d+\.\d+/g);
            let redMapFlg = this.handleCodeCentricIntegerRedMap(threadInfo['Redmap']);
            if((num !== null && parseInt(num[0]) > this.threshold) || redMapFlg) {
                reportDetail.write('<details><summary><font size="3" color="black">💡 [' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            } else {
                reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            }
            reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>');
            if(num !== null && parseInt(num[0]) > this.threshold) {
                reportDetail.write('<p><code><ins>💡 The Fully Redundant Zero is high. There may be optimization </br>opportunities to optimize with <strong>if/else</strong> statements to skip the </br>redundant memory loads and corresponding computations.</ins></code></p>');
            }
            if(redMapFlg) {
                reportDetail.write('<li><font color="black">Redmap:' + threadInfo['Redmap'] + '</font></li>');
                reportDetail.write('<p><code><ins>💡 The Redmap shows that the the most significant bytes of the </br>loaded values are always redundant zeros. Lowering to a less precise data type </br>may lead to better performance and cache utilization.</ins></code></p></ul>');
            } else {
                reportDetail.write('<li><font color="black">Redmap:' + threadInfo['Redmap'] + '</font></li></ul>');
            }
            
            reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
            reportDetail.write(String(threadInfo['CCT Info']).replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</br>"));
            reportDetail.write('</blockquote></details>' + os.EOL);
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }

    genCodeCentricFloatingPoint(floatingPointInfo:[], reportDetail:fs.WriteStream) {
        let infoNum = floatingPointInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Floating Point Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = floatingPointInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>\
                                    <li><font color="black">Redmap: [mantissa | exponent | sign]:' + threadInfo['Redmap: [mantissa | exponent | sign]'] + '</font></li></ul>');
            reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
            reportDetail.write(String(threadInfo['CCT Info']).replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</br>"));
            reportDetail.write('</blockquote></details>' + os.EOL);
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }

    genThreadDetailedDataCentricMetrics(threadNum:number) {
        for(let i = 0; i < threadNum ; i++) {
            let reportDetail = fs.createWriteStream(this.reportPath + 'thread' + i + 'DCDetail.md', {
                flags:'w'
            });
            reportDetail.write('## Thread ' + i + ' Detailed Metrics (Data Centric)' + os.EOL);
            let threadDetailedDataCentricMetrics = this.reportJson['Thread ' + i +' Detailed Metrics']['Data Centric'];
            let integerInfo = threadDetailedDataCentricMetrics['Integer Redundant Info'];
            let floatingPointInfo = threadDetailedDataCentricMetrics['Floating Point Redundant Info'];
            this.genDataCentricIntegerInfo(integerInfo, reportDetail);
            this.genDataCentricFloatingPoint(floatingPointInfo, reportDetail);
        }
    }

    genHeatMap(redfileName:string) {
        // redmap 中存对应的redmap文件名，与report文件必须在同一文件夹下，md相对寻址。
        // redmap文件在reportPath:string，通过读取新建一个md文件，只放代码块，能生成热力图;
        // .redmap文件的排列方式，前一半为accmap，后一半为redmap，每个字节内部的位是小端排序，解析时，例如一个字节是239，不断%2，/2，获得的顺序即可
        // console.log(this.reportPath.replace("\\report", "") + redfileName);
        let redmapDetail = fs.createWriteStream(this.reportPath + redfileName.replace(".redmap", ".md"), {
            flags:'w'
        });
        let redmap = this.reportPath.replace("\\report", "") + redfileName;
        redmapDetail.write("==Please install vscode extension MPE and use run block to draw the heatmap==" + os.EOL + os.EOL);
        redmapDetail.write("> **_NOTE:_**  💡There are three kinds of value in the heatmap: 0 means zero byte, 1 means non-zero byte and 2 means not access byte." + os.EOL + os.EOL);
        redmapDetail.write("```python {cmd=true matplotlib=true numpy=true}"+ os.EOL +"import os"+ os.EOL +"import struct"+ os.EOL +"import matplotlib.pyplot as plt"+ os.EOL +"import numpy as np"+ os.EOL +"def plot_heat_map(x, figure_no):"+ os.EOL +"    plt.figure(figure_no)"+ os.EOL +"    plt.pcolor(x)"+ os.EOL +"    plt.colorbar()"+ os.EOL +"    plt.show()"+ os.EOL +""+ os.EOL +"def gen_heat_graph(row_num, buf):"+ os.EOL +"    acc = 0"+ os.EOL +"    red = int(len(buf) / 2)"+ os.EOL +"    redmap = []"+ os.EOL +"    for i in range(int(len(buf) / 2)):"+ os.EOL +"        accByte = buf[acc + i]"+ os.EOL +"        redByte = buf[red + i]"+ os.EOL +"        j = 8"+ os.EOL +"        while j > 0:"+ os.EOL +"            j = j - 1"+ os.EOL +"            accBit = accByte % 2"+ os.EOL +"            redBit = redByte % 2"+ os.EOL +"            redByte = int(redByte / 2)"+ os.EOL +"            accByte = int(accByte / 2)"+ os.EOL +"            if not accBit:"+ os.EOL +"                if redBit:"+ os.EOL +"                    redmap.append(0)"+ os.EOL +"                else:"+ os.EOL +"                    redmap.append(1)"+ os.EOL +"            else:"+ os.EOL +"                redmap.append(2)"+ os.EOL +"    arr = np.array_split(redmap, row_num)"+ os.EOL +"    plot_heat_map(arr, 2)"+ os.EOL +""+ os.EOL +"if __name__ == '__main__':"+ os.EOL +"    filepath = r'" + redmap + "'"+ os.EOL +"    redMap = open(filepath, 'rb')"+ os.EOL +"    size = os.path.getsize(filepath)"+ os.EOL +"    buf = []"+ os.EOL +"    for i in range(size):"+ os.EOL +"        data = redMap.read(1)"+ os.EOL +"        num = struct.unpack('B', data)"+ os.EOL +"        buf.append(num[0])"+ os.EOL +"    # row_num = 1, 2, 4, 8..."+ os.EOL +"    gen_heat_graph(1, buf)"+ os.EOL +"    redMap.close()"+ os.EOL +"```");
    }
    
    genDataCentricIntegerInfo(integerInfo:[], reportDetail:fs.WriteStream) {
        let infoNum = integerInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Integer Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = integerInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">' + threadInfo['name'] + '</font></summary><blockquote>');
            if(threadInfo['name'] === 'Dynamic Object') {
                reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
                reportDetail.write(String(threadInfo['CCT Info']).replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</br>"));
                reportDetail.write('</blockquote></details>' + os.EOL);
            }
            reportDetail.write('<ul><li><font color="black">[' + threadInfo['rate'] + '%] Redundancy: ' + threadInfo['Redundancy'] + ' </font></li>');
            let dataNum = threadInfo['dataNum'];
            for(let j = 0; j < dataNum; j++) {
                reportDetail.write('<li><ul><li><font color="black">Data Size: ' + threadInfo['Data Size ' + j] + '</font></li>');
                reportDetail.write('<li><font color="black">Not Accessed Data: ' + threadInfo['Not Accessed Data ' + j] + '</font></li>');
                reportDetail.write('<li><font color="black">Redundant Data: ' + threadInfo['Redundant Data ' + j] + '</font></li>');
                if(threadInfo['Redmap ' + j]) {
                    this.genHeatMap(threadInfo['Redmap ' + j]);
                    reportDetail.write('<li><font color="black">Redmap: ' + '<a href="' + (<string> threadInfo['Redmap ' + j]).replace(".redmap", ".md") +'" title="redmap">redmap</a>' + '</font></li></ul></li>');
                }
            }
            reportDetail.write('</ul>');
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }

    genDataCentricFloatingPoint(floatingPointInfo:[], reportDetail:fs.WriteStream) {
        let infoNum = floatingPointInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Floating Point Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = floatingPointInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">' + threadInfo['name'] + '</font></summary><blockquote>');
            if(threadInfo['name'] === 'Dynamic Object') {
                reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
                reportDetail.write(String(threadInfo['CCT Info']).replace(/</g,"&lt;").replace(/>/g, "&gt;").replace(/\n/g, "</br>"));
                reportDetail.write('</blockquote></details>' + os.EOL);
            }
            reportDetail.write('<ul><li><font color="black">[' + threadInfo['rate'] + '%] Redundancy: ' + threadInfo['Redundancy'] + ' </font></li>');
            let dataNum = threadInfo['dataNum'];
            for(let j = 0; j < dataNum; j++) {
                reportDetail.write('<li><ul><li><font color="black">Data Size: ' + threadInfo['Data Size ' + j] + '</font></li>');
                reportDetail.write('<li><font color="black">Not Accessed Data: ' + threadInfo['Not Accessed Data ' + j] + '</font></li>');
                reportDetail.write('<li><font color="black">Redundant Data: ' + threadInfo['Redundant Data ' + j] + '</font></li>');
                if(threadInfo['Redmap ' + j]) {
                    this.genHeatMap(threadInfo['Redmap ' + j]);
                    reportDetail.write('<li><font color="black">Redmap: ' + '<a href="' + (<string> threadInfo['Redmap ' + j]).replace(".redmap", ".md") +'" title="redmap">redmap</a>' + '</font></li></ul></li>');
                }
            }
            reportDetail.write('</ul>');
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }
}