using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;

namespace OpenFin.Notifications
{
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

        [JsonProperty("customData")]
        public object CustomData { get; set; }

        [JsonProperty("date")]
        public DateTime Date { get; set; } = DateTime.Now;

        [JsonProperty("buttons")]
        public IEnumerable<NotificationButton> Buttons { get; set; }

        public NotificationOptions()
        {
            this.CustomData = new object();
        }
    }
}