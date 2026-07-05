package com.surveysetu.app.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.graphics.*
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections
import com.dantsu.escposprinter.textparser.PrinterTextParserImg
import com.surveysetu.app.ui.QuestionUiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object PrintManager {

    /**
     * WORLD-CLASS PRINTING ENGINE V3:
     * High-scale font support and 4-inch (112mm) paper width integration.
     */
    @SuppressLint("MissingPermission")
    suspend fun printSurveyReceipt(
        printerName: String,
        surveyTitle: String,
        respondentName: String,
        respondentContact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        paperSizeMm: Int = 58,
        selectedFont: String = "Roboto",
        fontSize: Int = 24
    ): Result<Unit> = withContext(Dispatchers.IO) {
        return@withContext try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
            val device = pairedDevices.find { it.name == printerName || it.address == printerName }
                ?: return@withContext Result.failure(Exception("Printer not found"))

            val connection = BluetoothPrintersConnections().getList()?.find { it.getDevice().address == device.address }
                ?: return@withContext Result.failure(Exception("Connection failed"))

            // DPI and paper width calculation for ESC/POS
            // 58mm = ~384px, 80mm = ~576px, 112mm = ~864px
            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)
            
            val bitmap = generateReceiptBitmap(
                title = surveyTitle, 
                name = respondentName, 
                contact = respondentContact, 
                questions = questions, 
                answers = answers, 
                widthMm = paperSizeMm,
                fontName = selectedFont,
                fontSize = fontSize.toFloat()
            )

            printer.printFormattedText(
                "[C]<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, bitmap) + "</img>\n\n\n"
            )

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun generateReceiptBitmap(
        title: String,
        name: String,
        contact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        widthMm: Int,
        fontName: String,
        fontSize: Float
    ): Bitmap {
        // Precise pixel calculation for large widths
        val widthPx = when (widthMm) {
            112 -> 864
            80 -> 576
            else -> 384
        }
        
        val paint = TextPaint().apply {
            color = Color.BLACK
            textSize = fontSize
            isAntiAlias = true
            typeface = Typeface.create(fontName, Typeface.BOLD)
        }

        val content = StringBuilder()
        content.append("$title\n")
        content.append("--------------------------------\n")
        content.append("Respondent: $name\n")
        content.append("Contact: $contact\n")
        content.append("--------------------------------\n")
        
        questions.forEachIndexed { i, q ->
            val ans = q.options.find { it.id == answers[q.id] }?.text ?: "N/A"
            content.append("${i + 1}. ${q.text}\n")
            content.append("   Ans: $ans\n\n")
        }

        val staticLayout = StaticLayout.Builder.obtain(content.toString(), 0, content.length, paint, widthPx)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.2f)
            .build()

        val bitmap = Bitmap.createBitmap(widthPx, staticLayout.height + 60, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.translate(0f, 30f)
        staticLayout.draw(canvas)

        return bitmap
    }
}
