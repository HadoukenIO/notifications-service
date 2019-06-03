using Newtonsoft.Json.Linq;
using Openfin.Desktop;
using Openfin.Desktop.Messaging;
using OpenFin.Notifications.Constants;
using System;
using System.Threading.Tasks;

namespace OpenFin.Notifications
{
    public class NotificationClient
    {
        private static Runtime RuntimeInstance;
        private static ChannelClient ChannelClient;

        public static event EventHandler NotificationClicked;

        public static event EventHandler NotificationButtonClicked;

        public static event EventHandler NotificationClosed;

        public static Action<Exception> InitializationComplete;

        public static void Initialize()
        {
            Initialize(new Uri(NotificationConstants.ServiceManifestUrl));
        }

        public static void Initialize(Uri manifestUri)
        {
            if (InitializationComplete == null)
                throw new InvalidOperationException("InitializationComplete must be handled before calling Initialize.");

            var runtimeOptions = RuntimeOptions.LoadManifest(manifestUri);

            var entryAssembly = System.Reflection.Assembly.GetEntryAssembly();
            var productAttributes = entryAssembly.GetCustomAttributes(typeof(System.Reflection.AssemblyProductAttribute), true);

            if (productAttributes.Length > 0)
            {
                runtimeOptions.UUID = ((System.Reflection.AssemblyProductAttribute)productAttributes[0]).Product;
            }
            else
            {
                runtimeOptions.UUID = System.Reflection.Assembly.GetEntryAssembly().GetName().Name;
            }

            RuntimeInstance = Runtime.GetRuntimeInstance(runtimeOptions);
            RuntimeInstance.Connect(() =>
            {
                var notificationsService = RuntimeInstance.CreateApplication(runtimeOptions.StartupApplicationOptions);

                notificationsService.isRunning(ack =>
                {
                    if (!(bool)(ack.getData() as JValue).Value)
                    {
                        notificationsService.run();
                    }

                    ChannelClient = RuntimeInstance.InterApplicationBus.Channel.CreateClient(NotificationConstants.ServiceChannelName);
                    
                    ChannelClient.RegisterTopic(NotificationTopicConstants.NotificationClicked, OnNotificationClicked);
                    ChannelClient.RegisterTopic(NotificationTopicConstants.NotifciationButtonClicked, OnNotificationButtonClicked);
                    ChannelClient.RegisterTopic(NotificationTopicConstants.NotificationClosed, OnNotificationClosed);

                    ChannelClient.ConnectAsync().ContinueWith(x => InitializationComplete?.Invoke(x.Exception));
                });
            });
        }

        private static void OnNotificationClicked()
        {
            NotificationClicked?.Invoke(null, EventArgs.Empty);            
        }

        private static void OnNotificationButtonClicked()
        {
            NotificationButtonClicked?.Invoke(null, EventArgs.Empty);            
        }

        private static void OnNotificationClosed()
        {
            NotificationClosed?.Invoke(null, EventArgs.Empty);            
        }

        public async static Task<NotificationOptions> Create(string id, NotificationOptions options)
        {
            //HACK: Change protocol flattening
            options.ID = id;
            var result = (await ChannelClient?.DispatchAsync<object>(NotificationConstants.CreateNotification, options)) as JObject;
            return result.ToObject<NotificationOptions>();
        }

        public async static Task<bool> Clear(string id)
        {
            return Convert.ToBoolean(await ChannelClient?.DispatchAsync<object>(NotificationConstants.ClearNotifications, new { id = id }));
        }

        public async static Task<NotificationOptions[]> GetAll()
        {
            var result = (await ChannelClient?.DispatchAsync<object>(NotificationConstants.GetAppNotifications, new JObject()));

            if (result != null)
                return (result as JArray).ToObject<NotificationOptions[]>();
            else
                return null;
        }

        public async static Task<int> ClearAll()
        {
            var result = (await ChannelClient?.DispatchAsync<object>(NotificationConstants.ClearAppNotifications, JValue.CreateUndefined())) as JObject;
            return result.ToObject<int>();
        }

        public static Task ToggleNotificationCenter()
        {
            return ChannelClient?.DispatchAsync<object>(NotificationConstants.ToggleNotificationCenter, JValue.CreateUndefined());
        }
    }
}