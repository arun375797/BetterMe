package com.betterme.healthbridge

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.isVisible
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import com.betterme.healthbridge.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var health: HealthConnectManager
    private val api = BetterMeApi()
    private val syncPreferences by lazy { getSharedPreferences("fit3_sync", MODE_PRIVATE) }

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        if (granted.any { it != HealthConnectManager.HISTORY_PERMISSION }) {
            loadLatestSleep()
        } else {
            showStatus("Health permissions were not granted")
            binding.emptyMessage.text = "Allow at least one health category to continue."
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        health = HealthConnectManager(this)
        binding.connectButton.setOnClickListener { connectHealth() }
        binding.refreshButton.setOnClickListener { loadLatestSleep() }
        binding.syncButton.setOnClickListener { syncToBetterMe() }
        updateConnectionState()
    }

    override fun onResume() {
        super.onResume()
        if (::health.isInitialized && health.sdkStatus == HealthConnectClient.SDK_AVAILABLE) {
            lifecycleScope.launch { if (health.hasAnyDataPermission()) loadLatestSleep() }
        }
    }

    private fun updateConnectionState() {
        when (health.sdkStatus) {
            HealthConnectClient.SDK_AVAILABLE -> lifecycleScope.launch {
                if (health.hasAnyDataPermission()) loadLatestSleep() else {
                    showStatus("Ready to connect")
                    binding.connectButton.text = "Allow Fit3 health access"
                }
            }
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> {
                showStatus("Health Connect needs installation or an update")
                binding.connectButton.text = "Install Health Connect"
            }
            else -> {
                showStatus("Health Connect is unavailable on this phone")
                binding.connectButton.isEnabled = false
                binding.emptyMessage.text = "Health Connect requires Android 9 or newer."
            }
        }
    }

    private fun connectHealth() {
        when (health.sdkStatus) {
            HealthConnectClient.SDK_AVAILABLE -> permissionLauncher.launch(HealthConnectManager.PERMISSIONS)
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> openHealthConnectStore()
        }
    }

    private fun openHealthConnectStore() {
        val market = Uri.parse("market://details?id=${HealthConnectManager.PROVIDER_PACKAGE}")
        val web = Uri.parse("https://play.google.com/store/apps/details?id=${HealthConnectManager.PROVIDER_PACKAGE}")
        try { startActivity(Intent(Intent.ACTION_VIEW, market)) }
        catch (_: ActivityNotFoundException) { startActivity(Intent(Intent.ACTION_VIEW, web)) }
    }

    private fun loadLatestSleep() {
        setBusy(true)
        showStatus("Connected · health history ready")
        binding.connectButton.isVisible = false
        binding.syncCard.isVisible = true
        lifecycleScope.launch {
            runCatching { health.latestSleep() }
                .onSuccess { sleep ->
                    setBusy(false)
                    if (sleep == null) showNoSleep() else showSleep(sleep)
                }
                .onFailure {
                    setBusy(false)
                    binding.sleepCard.isVisible = false
                    binding.emptyMessage.isVisible = true
                    binding.emptyMessage.text = "Sleep permission is unavailable, but other granted Fit3 data can still sync."
                }
        }
    }

    private fun showSleep(sleep: SleepSummary) {
        binding.emptyMessage.isVisible = false
        binding.sleepCard.isVisible = true
        val startZone = sleep.startZoneOffset ?: ZoneId.systemDefault().rules.getOffset(sleep.startTime)
        val endZone = sleep.endZoneOffset ?: ZoneId.systemDefault().rules.getOffset(sleep.endTime)
        val start = sleep.startTime.atOffset(startZone)
        val end = sleep.endTime.atOffset(endZone)
        binding.sleepDate.text = end.format(DateTimeFormatter.ofPattern("EEEE, d MMMM"))
        binding.sleepDuration.text = formatMinutes(sleep.durationMinutes)
        binding.sleepWindow.text = "${start.format(DateTimeFormatter.ofPattern("h:mm a"))} → ${end.format(DateTimeFormatter.ofPattern("h:mm a"))}"
        binding.sleepStages.text = if (sleep.stageMinutes.isEmpty()) "No detailed stages were supplied." else
            "Actual asleep  ·  ${formatMinutes(sleep.actualSleepMinutes)}\n" +
                sleep.stageMinutes.entries.joinToString("\n") { (label, minutes) -> "$label  ·  ${formatMinutes(minutes)}" }
    }

    private fun showNoSleep() {
        binding.sleepCard.isVisible = false
        binding.emptyMessage.isVisible = true
        binding.emptyMessage.text = "No recent sleep was found. Steps, heart rate, oxygen, workouts, distance, calories and floors can still sync."
    }

    private fun syncToBetterMe() {
        val baseUrl = binding.apiUrlInput.text?.toString().orEmpty()
        val pin = binding.pinInput.text?.toString().orEmpty()
        if (pin.isBlank()) {
            binding.pinInput.error = "Enter your BetterMe PIN"
            return
        }
        val syncStartedAt = Instant.now()
        val localZone = ZoneId.systemDefault()
        // v3 intentionally starts with a clean 40-day reconciliation once so
        // installs upgraded from the old append-only sync repair inflated data.
        val previous = syncPreferences.getString("last_successful_sync_v3", null)
            ?.let { runCatching { Instant.parse(it) }.getOrNull() }
        val since = previous
            ?.atZone(localZone)
            ?.toLocalDate()
            ?.minusDays(1)
            ?.atStartOfDay(localZone)
            ?.toInstant()
        binding.syncButton.isEnabled = false
        binding.syncMessage.setTextColor(getColor(R.color.muted))
        binding.syncMessage.text = if (since == null) "Importing the latest 40 days…" else "Checking for new and updated health records…"

        lifecycleScope.launch {
            runCatching {
                val token = api.login(baseUrl, pin)
                val initialDayCount = if (health.hasHistoryPermission()) 40L else 30L
                val readFrom = since ?: syncStartedAt
                    .atZone(localZone)
                    .toLocalDate()
                    .minusDays(initialDayCount - 1)
                    .atStartOfDay(localZone)
                    .toInstant()
                binding.syncMessage.text = "Preparing a duplicate-free sync window…"
                api.reconcileWearableWindow(baseUrl, token, readFrom, syncStartedAt.plus(1, ChronoUnit.MINUTES), previous == null)
                health.syncHistory(
                    incrementalSince = since,
                    onBatch = { api.syncBatch(baseUrl, token, it) },
                    onProgress = { progress ->
                        binding.syncMessage.text = "Synced ${progress.totalRecords} records · ${progress.counts.entries.joinToString { "${it.key} ${it.value}" }}"
                    },
                )
            }.onSuccess { progress ->
                syncPreferences.edit().putString("last_successful_sync_v3", syncStartedAt.toString()).apply()
                binding.pinInput.text?.clear()
                binding.syncMessage.setTextColor(getColor(R.color.mint_dark))
                binding.syncMessage.text = "Complete · ${progress.totalRecords} records checked and safely upserted."
            }.onFailure { error ->
                binding.syncMessage.setTextColor(getColor(R.color.coral_dark))
                binding.syncMessage.text = error.friendlyMessage()
            }
            binding.syncButton.isEnabled = true
        }
    }

    private fun showStatus(message: String) { binding.statusChip.text = message }
    private fun setBusy(busy: Boolean) {
        binding.connectButton.isEnabled = !busy
        binding.refreshButton.isEnabled = !busy
    }
    private fun formatMinutes(total: Long): String {
        val hours = total / 60
        val minutes = total % 60
        return if (hours > 0) "${hours}h ${minutes}m" else "${minutes}m"
    }
    private fun Throwable.friendlyMessage(): String = message?.takeIf { it.isNotBlank() } ?: "Something went wrong. Please try again."
}
