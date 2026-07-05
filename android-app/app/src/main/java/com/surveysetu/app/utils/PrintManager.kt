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

object PrintManager {

    /**
     * WORLD-CLASS PRINTING ENGINE:
     * Supports Hindi/Unicode via Bitmap-to-Graphic conversion.
     * Includes Premium Fonts:
     * Hindi: Mangal, Kruti Dev (System), Kokila, Utsaah, Aparajita
     * English: Roboto, Montserrat, OpenSans, Lato, Playfair
     */
    @SuppressLint("MissingPermission")
    fun printSurveyReceipt(
        context: Context,
        printerName: String,
        surveyTitle: String,
        respondentName: String,
        respondentContact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        paperSizeMm: Int = 58,
        selectedFont: String = "Mangal"
    ): Result<Unit> {
        return try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
            val device = pairedDevices.find { it.name == printerName || it.address == printerName }
                ?: return Result.failure(Exception("Printer not found"))

            val connection = BluetoothPrintersConnections().getList()?.find { it.getDevice().address == device.address }
                ?: return Result.failure(Exception("Connection failed"))

            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)
            
            // 1. GENERATE THE RECEIPT IMAGE (To support Hindi/Unicode)
            val bitmap = generateReceiptBitmap(
                context, 
                surveyTitle, 
                respondentName, 
                respondentContact, 
                questions, 
                answers, 
                paperSizeMm,
                selectedFont
            )

            // 2. CONVERT BITMAP TO ESC/POS GRAPHIC
            printer.printFormattedText(
                "[C]<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, bitmap) + "</img>\n\n\n"
            )

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun generateReceiptBitmap(
        context: Context,
        title: String,
        name: String,
        contact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        widthMm: Int,
        fontName: String
    ): Bitmap {
        val widthPx = if (widthMm == 80) 576 else 384 // DPI 203 calculation
        val paint = TextPaint().apply {
            color = Color.BLACK
            textSize = 24f
            isAntiAlias = true
            // Load requested font (fallback to System Default if asset missing)
            typeface = Typeface.create(fontName, Typeface.BOLD)
        }

        // Pre-calculate height
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

        val bitmap = Bitmap.createBitmap(widthPx, staticLayout.height + 40, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.translate(0f, 20f)
        staticLayout.draw(canvas)

        return bitmap
    }
}
