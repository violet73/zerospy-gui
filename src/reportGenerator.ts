import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { openStdin } from 'process';
type Dict = {[k:string]: any};

export class ReportJsonToMd {
    reportJson:Dict;
    reportMd;

    constructor(private reportRoot: string) {
        this.reportMd = fs.createWriteStream('abspath/to/report.md', {
            flags:'w'
        });
        this.reportJson = JSON.parse(fs.readFileSync(path.join(reportRoot, 'report.json'), 'utf-8'));
	}

    genMetricOverview() {
        this.reportMd.write('## Metric Overview' + os.EOL);
        let metricOverview:Dict = this.reportJson['Metric Overview'];
        let threadNum:number = parseInt(metricOverview['Thread Num']);
        this.genMetricOverviewInteger(metricOverview['Total Integer Redundant Bytes'], threadNum);
        this.genMetricOverviewFloatingPoint(metricOverview['Total Floating Point Redundant Bytes'], threadNum);
    }

    genMetricOverviewInteger(metricOverviewInteger:Dict, threadNum:number) {
        let rate = metricOverviewInteger['rate'];
        let fraction = metricOverviewInteger['fraction'];
        this.reportMd.write('<details><summary>Total Integer Redundant Bytes: ' + rate +' % ( ' + fraction + ' )</summary><blockquote>' + os.EOL);
        for(let i = 0; i < threadNum ; i++) {
            let threadData = metricOverviewInteger['Thread ' + i]['Total Integer Redundant Bytes'];
            this.reportMd.write('Thread ' + i +': Total Integer Redundant Bytes: ' + threadData['rate'] + ' % (' + threadData['fraction'] + ') <a href="' + threadData['detail'] +'" title="detail">detail</a></br>');
        }
        this.reportMd.write('</blockquote></details>' + os.EOL);
    }

    genMetricOverviewFloatingPoint(metricOverviewFloatingPoint:Dict, threadNum:number) {
        let rate = metricOverviewFloatingPoint['rate'];
        let fraction = metricOverviewFloatingPoint['fraction'];
        this.reportMd.write('<details><summary>Total Floating Point Redundant Bytes: ' + rate +' % ( ' + fraction + ' )</summary><blockquote>' + os.EOL);
        for(let i = 0; i < threadNum ; i++) {
            let threadData = metricOverviewFloatingPoint['Thread ' + i]['Total Floating Point Redundant Bytes'];
            this.reportMd.write('Thread ' + i +': Total Floating Point Redundant Bytes: ' + threadData['rate'] + ' % (' + threadData['fraction'] + ') <a href="' + threadData['detail'] +'" title="detail">detail</a></br>');
        }
        this.reportMd.write('</blockquote></details>' + os.EOL);
    }
}