using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace OpenFin.Notifications
{
    public class OptionButton
    {
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("iconUrl")]
        public string Icon { get; set; }
    }
}
