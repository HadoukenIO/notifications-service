using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

using Fin = Openfin.Desktop;

namespace OpenFin.Notifications
{
    public class NotificationClient
    {
        const string NotificationsServiceChannelName = "of-notifications-service-v1";
        const string NotificationsServiceManifestUrl = "https://cdn.openfin.co/services/openfin/notifications/app.json";

        private static Fin.Runtime RuntimeInstance;
        private static Fin.ChannelClient ChannelClient;

        public static event EventHandler NotificationClicked;
        public static event EventHandler NotificationButtonClicked;
        public static event EventHandler NotificationClosed;

        public static void Initialize()
        {
            Initialize(new Uri(NotificationsServiceManifestUrl));
        }

        public static void Initialize(Uri manifestUri)
        {
            var runtimeOptions = Fin.RuntimeOptions.LoadManifest(manifestUri);

            var entryAssembly = System.Reflection.Assembly.GetEntryAssembly();
            var productAttributes = entryAssembly.GetCustomAttributes(typeof(System.Reflection.AssemblyProductAttribute), true);

            if(productAttributes.Length > 0)
            {
                runtimeOptions.UUID = ((System.Reflection.AssemblyProductAttribute)productAttributes[0]).Product;
            }
            else
            {
                runtimeOptions.UUID = System.Reflection.Assembly.GetEntryAssembly().GetName().Name;
            }


            RuntimeInstance = Fin.Runtime.GetRuntimeInstance(runtimeOptions);
            RuntimeInstance.Connect(() =>
            {
                var notificationsService = RuntimeInstance.CreateApplication(runtimeOptions.StartupApplicationOptions);

                notificationsService.isRunning(ack =>
                {
                    if (!(bool)(ack.getData() as JValue).Value)
                    {
                        notificationsService.run();
                    }

                    ChannelClient = RuntimeInstance.InterApplicationBus.Channel.CreateClient(NotificationsServiceChannelName);

                    ChannelClient.RegisterTopic<object, object>("notification-clicked", OnNotificationClicked);
                    ChannelClient.RegisterTopic<object, object>("notification-button-clicked", OnNotificationButtonClicked);
                    ChannelClient.RegisterTopic<object, object>("notification-closed", OnNotificationClosed);

                    ChannelClient.Connect();
                });
            });
        }

        private static object OnNotificationClicked(object state)
        {
            NotificationClicked?.Invoke(null, EventArgs.Empty);
            return null;
        }
        private static object OnNotificationButtonClicked(object state)
        {
            NotificationButtonClicked?.Invoke(null, EventArgs.Empty);
            return null;
        }
        private static object OnNotificationClosed(object state)
        {
            NotificationClosed?.Invoke(null, EventArgs.Empty);
            return null;
        }

        public static Task<object> Create(string id, NotificationOptions options)
        {
            //HACK: Change protocol flattening
            options.ID = id;
            return ChannelClient?.Dispatch<object>("create-notification", options);
        }

        public static Task<object> Clear(string id)
        {
            return ChannelClient?.Dispatch<object>("clear-notification", new { id = id });
        }

        public static Task<object> GetAll()
        {
            var result = ChannelClient?.Dispatch<object>("fetch-app-notifications", new JObject());
            return result;
        }

        public static Task<object> ClearAll()
        {
            return ChannelClient?.Dispatch<object>("clear-app-notifications", JValue.CreateUndefined());
        }
    }

    public class NotificationOptions
    {
        [JsonProperty("id")]
        internal string ID { get; set; }
        [JsonProperty("body")]
        public string Body { get; set; }
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("subtitle")]
        public string Subtitle { get; set; }
        [JsonProperty("icon")]
        public string Icon { get; set; }
        [JsonProperty("context")]
        public object Context { get; set; }
        [JsonProperty("date")]
        public DateTime Date { get; set; } = DateTime.Now;
        [JsonProperty("buttons")]
        public IEnumerable<NotificationButton> Buttons { get; set; }

    }

    public class NotificationButton
    {
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("icon")]
        public string Icon { get; set; }
    }
}
