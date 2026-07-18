package top.babylink.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class LinkKeepAliveService extends Service {
    public static final String ACTION_START = "top.babylink.app.action.START_KEEP_ALIVE";
    public static final String ACTION_STOP = "top.babylink.app.action.STOP_KEEP_ALIVE";
    public static final String EXTRA_WAKE_LOCK = "wakeLock";

    private static final String KEEP_ALIVE_CHANNEL_ID = "babylink_keep_alive";
    private static final String MESSAGE_CHANNEL_ID = "babylink_messages";
    private static final int KEEP_ALIVE_NOTIFICATION_ID = 2101;
    private static volatile boolean running;
    private static volatile boolean wakeLockActive;

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        boolean useWakeLock = intent == null || intent.getBooleanExtra(EXTRA_WAKE_LOCK, true);
        updateWakeLock(useWakeLock);
        startForeground(KEEP_ALIVE_NOTIFICATION_ID, buildKeepAliveNotification(this));
        running = true;
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        running = false;
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public static boolean isRunning() {
        return running;
    }

    public static boolean isWakeLockActive() {
        return wakeLockActive;
    }

    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel keepAliveChannel = new NotificationChannel(
            KEEP_ALIVE_CHANNEL_ID,
            context.getString(R.string.keep_alive_channel_name),
            NotificationManager.IMPORTANCE_LOW
        );
        keepAliveChannel.setDescription(context.getString(R.string.keep_alive_channel_description));
        keepAliveChannel.setShowBadge(false);
        manager.createNotificationChannel(keepAliveChannel);
        NotificationChannel messageChannel = new NotificationChannel(
            MESSAGE_CHANNEL_ID,
            context.getString(R.string.message_channel_name),
            NotificationManager.IMPORTANCE_HIGH
        );
        messageChannel.setDescription(context.getString(R.string.message_channel_description));
        manager.createNotificationChannel(messageChannel);
    }

    public static void showMessageNotification(Context context, String title, String body, String tag) {
        createNotificationChannels(context);
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) launchIntent = new Intent(context, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int requestCode = tag == null ? 0 : tag.hashCode();
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        Notification notification = new NotificationCompat.Builder(context, MESSAGE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_keep_alive_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .build();
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) manager.notify(tag, requestCode, notification);
    }

    private static Notification buildKeepAliveNotification(Context context) {
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) launchIntent = new Intent(context, MainActivity.class);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            KEEP_ALIVE_NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        return new NotificationCompat.Builder(context, KEEP_ALIVE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_keep_alive_notification)
            .setContentTitle(context.getString(R.string.keep_alive_notification_title))
            .setContentText(context.getString(R.string.keep_alive_notification_text))
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    private void updateWakeLock(boolean enabled) {
        if (!enabled) {
            releaseWakeLock();
            return;
        }
        if (wakeLock != null && wakeLock.isHeld()) return;
        PowerManager manager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = manager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BabyLink:KeepAlive");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire();
        wakeLockActive = true;
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
        wakeLockActive = false;
    }
}