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
        console.log(this.threshold);
        console.log(reportRoot);
        this.reportPath = dirname(reportRoot) + path.sep + 'report' + path.sep;
        if (!fs.existsSync(this.reportPath)) {
            fs.mkdirSync(this.reportPath);
        }
        console.log(this.reportPath);
        
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

    genThreadDetailedMetrics() {
        let threadNum:number = parseInt(this.reportJson['Metric Overview']['Thread Num']);
        this.genThreadDetailedCodeCentricMetrics(threadNum);
        this.genThreadDetailedDataCentricMetrics(threadNum);
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

    genCodeCentricIntegerInfo(integerInfo:[], reportDetail:fs.WriteStream) {
        let infoNum = integerInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Integer Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = integerInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>');
            let num = String(threadInfo['Fully Redundant Zero']).match(/\d+\.\d+/g);
            if(num !== null && parseInt(num[0]) > this.threshold) {
                reportDetail.write('<p><code><ins>💡 The Fully Redundant Zero is high. There may be optimization </br>opportunities to optimize with <strong>if/else</strong> statements to skip the </br>redundant memory loads and corresponding computations.</ins></code></p>');
            }
            reportDetail.write('<li><font color="black">Redmap:' + threadInfo['Redmap'] + '</font></li></ul>');
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
            let reportDetail = fs.createWriteStream(this.reportPath + i + 'DCDetail.md', {
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
    
    genDataCentricIntegerInfo(integerInfo:Dict, reportDetail:fs.WriteStream) {
        // let infoNum = integerInfo.length;
        // let staticInfo = [];
        // let dynamicInfo = [];
        // integerInfo.forEach(ele=>)
        reportDetail.write('<details><summary><font size="5" color="black">Integer Redundant Info</font></summary><blockquote>' + os.EOL);
        this.genDataCentricStaticInfo(integerInfo['static'],reportDetail);
        this.genDataCentricStaticInfo(integerInfo['dynamic'],reportDetail);
        // for(let i = 0 ; i < infoNum ; i++) {
        //     let threadInfo = integerInfo[i];
        //     reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
        //     reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>');
        //     let num = String(threadInfo['Fully Redundant Zero']).match(/\d+\.\d+/g);
        //     if(num !== null && parseInt(num[0]) > this.threshold) {
        //         reportDetail.write('<p><code><ins>💡 The Fully Redundant Zero is high. There may be optimization </br>opportunities to optimize with <strong>if/else</strong> statements to skip the </br>redundant memory loads and corresponding computations.</ins></code></p>');
        //     }
        //     reportDetail.write('<li><font color="black">Redmap:' + threadInfo['Redmap'] + '</font></li></ul>');
        //     reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
        //     reportDetail.write('</blockquote></details>' + os.EOL);
        //     reportDetail.write('</blockquote></details>' + os.EOL);
        // }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }

    genDataCentricFloatingPoint(floatingPointInfo:[], reportDetail:fs.WriteStream) {
        return;
        let infoNum = floatingPointInfo.length;
        reportDetail.write('<details><summary><font size="5" color="black">Floating Point Redundant Info</font></summary><blockquote>' + os.EOL);
        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = floatingPointInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>\
                                    <li><font color="black">Redmap: [mantissa | exponent | sign]:' + threadInfo['Redmap: [mantissa | exponent | sign]'] + '</font></li></ul>');
            reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
            reportDetail.write('</blockquote></details>' + os.EOL);
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
        reportDetail.write('</blockquote></details>' + os.EOL);
    }

    genDataCentricStaticInfo(staticInfo:[], reportDetail:fs.WriteStream) {
        reportDetail.write('<details><summary><font size="5" color="black">Static</font></summary><blockquote>' + os.EOL);

        let infoNum = staticInfo.length;

        for(let i = 0 ; i < infoNum ; i++) {
            let threadInfo = staticInfo[i];
            reportDetail.write('<details><summary><font size="3" color="black">[' + threadInfo['Redundancy'] + '%] Redundancy, with local redundancy ' + threadInfo['local redundancy'] + '</font></summary><blockquote>');
            reportDetail.write('<ul><li><font color="black">Fully Redundant Zero:' + threadInfo['Fully Redundant Zero'] + '</font></li>');
            let num = String(threadInfo['Fully Redundant Zero']).match(/\d+\.\d+/g);
            if(num !== null && parseInt(num[0]) > this.threshold) {
                reportDetail.write('<p><code><ins>💡 The Fully Redundant Zero is high. There may be optimization </br>opportunities to optimize with <strong>if/else</strong> statements to skip the </br>redundant memory loads and corresponding computations.</ins></code></p>');
            }
            reportDetail.write('<li><font color="black">Redmap:' + threadInfo['Redmap'] + '</font></li></ul>');
            reportDetail.write('<details><summary><font color="black">CCT Info:</font></summary><blockquote>');
            reportDetail.write('</blockquote></details>' + os.EOL);
            reportDetail.write('</blockquote></details>' + os.EOL);
        }
    }
}