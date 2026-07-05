package com.surveysetu.app.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections
import com.surveysetu.app.ui.QuestionUiModel

object PrintManager {

    @SuppressLint("MissingPermission")
    fun printSurveyReceipt(
        printerName: String,
        surveyTitle: String,
        respondentName: String,
        respondentContact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        paperSizeMm: Int = 58
    ): Result<Unit> {
        return try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
            val device = pairedDevices.find { it.name == printerName || it.address == printerName }
                ?: return Result.failure(Exception("Printer not found"))

            // Professional library implementation for ESC/POS
            val connection = BluetoothPrintersConnections().getList()?.find { it.getDevice().address == device.address }
                ?: return Result.failure(Exception("Could not establish connection to device"))
                
            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)

            val formattedText = StringBuilder()
            formattedText.append("[C]<b><font size='big'>$surveyTitle</font></b>\n")
            formattedText.append("[C]--------------------------------\n")
            formattedText.append("[L]<b>Respondent:</b> $respondentName\n")
            formattedText.append("[L]<b>Contact:</b> $respondentContact\n")
            formattedText.append("[C]--------------------------------\n")

            questions.forEachIndexed { index, q ->
                val selectedOptionId = answers[q.id]
                val selectedOptionText = q.options.find { it.id == selectedOptionId }?.text ?: "N/A"
                formattedText.append("[L]<b>${index + 1}. ${q.text}</b>\n")
                formattedText.append("[L]   Ans: $selectedOptionText\n\n")
            }

            formattedText.append("[C]--------------------------------\n")
            formattedText.append("[C]<font size='small'>Authenticated by SurveySetu Cloud</font>\n")
            formattedText.append("[C]<font size='small'>${java.util.Date()}</font>\n")
            formattedText.append("\n\n\n")

            printer.printFormattedText(formattedText.toString())
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
