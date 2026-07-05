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
     * WORLD-CLASS PRINTING ENGINE V4 (PRO-MAX):
     * Implements massive font scaling (2.5x Multiplier) for high-readability on thermal paper.
     * Hard-wired for 203 DPI precision across 58mm, 80mm, and 112mm paper.
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

            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)
            
            // We use a massive 2.5x multiplier to ensure the text fills the paper width properly
            val scaledFontSize = fontSize.toFloat() * 2.5f

            val bitmap = generateReceiptBitmap(
                title = surveyTitle, 
                name = respondentName, 
                contact = respondentContact, 
                questions = questions, 
                answers = answers, 
                widthMm = paperSizeMm,
                fontName = selectedFont,
                fontSize = scaledFontSize
            )

            // Center the massive bitmap for perfect alignment
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
        // High-precision pixel targets for standard thermal widths
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
        content.append("================================\n")
        content.append("NAME: $name\n")
        content.append("MOB: $contact\n")
        content.append("================================\n\n")
        
        questions.forEachIndexed { i, q ->
            val ans = q.options.find { it.id == answers[q.id] }?.text ?: "N/A"
            content.append("${i + 1}. ${q.text}\n")
            content.append(">> ANS: $ans\n\n")
        }

        content.append("--------------------------------\n")
        content.append("AUTHENTICATED BY SURVEYSETU\n")

        val staticLayout = StaticLayout.Builder.obtain(content.toString(), 0, content.length, paint, widthPx)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.2f)
            .build()

        // Create bitmap with padding for tear-off
        val bitmap = Bitmap.createBitmap(widthPx, staticLayout.height + 80, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.translate(0f, 40f)
        staticLayout.draw(canvas)

        return bitmap
    }
}
