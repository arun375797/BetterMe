package com.betterme.healthbridge

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class BetterMeApi {
    suspend fun login(baseUrl: String, pin: String): String = withContext(Dispatchers.IO) {
        val root = checkedRoot(baseUrl)
        val response = postJson("$root/api/auth/login", JSONObject().put("pin", pin))
        response.optString("token").takeIf { it.isNotBlank() }
            ?: error("BetterMe did not return a session token.")
    }

    suspend fun syncBatch(baseUrl: String, token: String, records: List<SyncRecord>) =
        withContext(Dispatchers.IO) {
            val root = checkedRoot(baseUrl)
            val array = JSONArray()
            records.forEach { record ->
                array.put(
                    JSONObject()
                        .put("externalId", record.externalId)
                        .put("type", record.type)
                        .put("startTime", record.startTime.toString())
                        .put("endTime", record.endTime.toString())
                        .put("sourceApp", record.sourceApp)
                        .put("data", mapToJson(record.data))
                )
            }
            postJson("$root/api/wearable/sync", JSONObject().put("records", array), token)
        }

    private fun checkedRoot(value: String): String {
        require(value.startsWith("https://")) { "Use an HTTPS BetterMe API URL." }
        return value.trim().trimEnd('/')
    }

    private fun mapToJson(value: Map<String, Any?>): JSONObject {
        val json = JSONObject()
        value.forEach { (key, item) ->
            json.put(key, when (item) {
                null -> JSONObject.NULL
                is Map<*, *> -> mapToJson(item.entries.associate { it.key.toString() to it.value })
                is Iterable<*> -> JSONArray(item.toList())
                else -> item
            })
        }
        return json
    }

    private fun postJson(url: String, body: JSONObject, token: String? = null): JSONObject {
        val connection = URL(url).openConnection() as HttpURLConnection
        return try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 15_000
            connection.readTimeout = 30_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            if (!token.isNullOrBlank()) connection.setRequestProperty("Authorization", "Bearer $token")
            connection.outputStream.bufferedWriter(Charsets.UTF_8).use { it.write(body.toString()) }
            val status = connection.responseCode
            val stream = if (status in 200..299) connection.inputStream else connection.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            val response = runCatching { JSONObject(text) }.getOrElse { JSONObject() }
            if (status !in 200..299) throw ApiException(response.optString("message", "Request failed ($status)."))
            response
        } finally {
            connection.disconnect()
        }
    }
}

class ApiException(message: String) : Exception(message)
