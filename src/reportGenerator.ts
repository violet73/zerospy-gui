import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { openStdin } from 'process';
type Dict = {[k:string]: any};

export class ReportJsonToMd {
    reportJson:Dict;
    threshold:number;

    constructor(private reportRoot: string, threshold: number) {
        this.threshold = threshold === undefined ? 30:threshold;
        console.log(this.threshold);
        
        this.reportJson = JSON.parse(fs.readFileSync(path.join(reportRoot, 'report.json'), 'utf-8'));
	}

    genMetricOverview() {
        // let reportOverview = fs.createWriteStream('abspath/to/reportOverview.md', {
        //     flags:'w'
        // });
        let reportOverview = fs.createWriteStream('C:/Users/雷克伦/desktop/三下/vscode-cct/zerospy-gui/report/reportOverview.md', {
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
            let threadData = metricOverviewInteger['Thread ' + i]['Total Integer Redundant Bytes'];
            reportOverview.write('Thread ' + i +': Total Integer Redundant Bytes: ' + threadData['rate'] + ' % (' + threadData['fraction'] + ') <a href="' + threadData['detail'] +'" title="detail">detail</a></br>');
        }
        reportOverview.write('</blockquote></details>' + os.EOL);
    }

    genMetricOverviewFloatingPoint(metricOverviewFloatingPoint:Dict, threadNum:number, reportOverview:fs.WriteStream) {
        let rate = metricOverviewFloatingPoint['rate'];
        let fraction = metricOverviewFloatingPoint['fraction'];
        reportOverview.write('<details><summary>Total Floating Point Redundant Bytes: ' + rate +' % ( ' + fraction + ' )</summary><blockquote>' + os.EOL);
        for(let i = 0; i < threadNum ; i++) {
            let threadData = metricOverviewFloatingPoint['Thread ' + i]['Total Floating Point Redundant Bytes'];
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
            let reportDetail = fs.createWriteStream('C:/Users/雷克伦/desktop/三下/vscode-cct/zerospy-gui/report/thread' + i + 'Detail.md', {
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

    genCodeCentricIntegerInfo(integerInfo:Dict, reportDetail:fs.WriteStream) {
        let infoNum = integerInfo['Num'];
        reportDetail.write('<details><summary>Integer Redundant Info</summary><blockquote>' + os.EOL);
    }

    genCodeCentricFloatingPoint(floatingPointInfo:Dict, reportDetail:fs.WriteStream) {
        
    }

    genThreadDetailedDataCentricMetrics(threadNum:number) {
        
    }
}