package com.surveysetu.app.data

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import android.util.Log

object RetrofitClient {
    /**
     * ABSOLUTE PRODUCTION ENDPOINT:
     * This is the FINAL, hard-coded cloud address.
     * Uses strict HTTPS with a trailing slash to prevent redirection loops.
     */
    private const val BASE_URL = "https://surveysetu-production.up.railway.app/"

    var authToken: String? = null

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            authToken?.let {
                requestBuilder.addHeader("Authorization", "Bearer $it")
            }
            
            // LOGGING: Track outgoing requests to pinpoint any connection drops
            val request = requestBuilder.build()
            Log.i("RetrofitClient", "==> REQUEST: ${request.url}")
            
            val response = try {
                chain.proceed(request)
            } catch (e: Exception) {
                Log.e("RetrofitClient", "CRITICAL CONNECTION FAILURE: ${e.message}")
                throw e
            }
            
            Log.i("RetrofitClient", "<== RESPONSE CODE: ${response.code}")
            
            // SECURITY: Handle user/device locking
            if (response.code == 401 || response.code == 403) {
                authToken = null
            }
            response
        }
        /**
         * NETWORK RESILIENCE:
         * We allow a full 60 seconds for DNS resolution and handshake.
         * This prevents "Unable to resolve host" errors on slow 4G/5G mobile data.
         */
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true) // Force retry on minor glitches
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
