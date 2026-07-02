package com.surveysetu.app.printer

import android.content.Context
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.connection.bluetooth.BluetoothConnection
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections
import com.surveysetu.app.data.ResponseEntity
import com.surveysetu.app.ui.AnswerUiModel

class PrinterManager(private val context: Context) {

    fun printReceipt(response: ResponseEntity, answers: List<AnswerUiModel>, printerSize: Int = 58) {
        val connection = BluetoothPrintersConnections.selectFirstPaired()
        if (connection != null) {
            val printer = EscPosPrinter(connection, 203, printerSize.toFloat(), 32)
            
            val content = buildPrintContent(response, answers)
            printer.printFormattedText(content)
        }
    }

    private fun buildPrintContent(response: ResponseEntity, answers: List<AnswerUiModel>): String {
        val sb = StringBuilder()
        sb.append("[C]<img>" + "LOGO_BITMAP_HERE" + "</img>\n") // Text or Bitmap
        sb.append("[C]<b>SURVEY SETU</b>\n")
        sb.append("[C]Field Data Collection\n")
        sb.append("[C]--------------------------------\n")
        sb.append("[L]Response ID: ${response.id.take(8)}\n")
        sb.append("[L]Surveyor: ${response.surveyorId}\n")
        sb.append("[L]Date: ${System.currentTimeMillis()}\n")
        sb.append("[C]--------------------------------\n")
        
        answers.forEachIndexed { index, answer ->
            sb.append("[L]Q${index + 1}: ${answer.questionId}\n")
            sb.append("[L]A: ${answer.selectedOptionId}\n")
        }
        
        sb.append("[C]--------------------------------\n")
        sb.append("[C]Thank you for your time!\n")
        sb.append("[C]<qrcode size='20'>${response.id}</qrcode>\n")
        
        return sb.toString()
    }
}
