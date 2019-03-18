using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using OpenFin.Notifications;
using Newtonsoft.Json.Linq;

namespace OpenFin.Notifications.Demo
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();

            NotificationClient.NotificationButtonClicked += NotificationClient_NotificationButtonClicked;
            NotificationClient.NotificationClicked += NotificationClient_NotificationClicked;
            NotificationClient.NotificationClosed += NotificationClient_NotificationClosed;

            NotificationClient.Initialize();
        }

        private void NotificationClient_NotificationClosed(object sender, EventArgs e)
        {
            Dispatcher.Invoke(() =>
            {
                messageBox.Text += "Notification Closed\n";
            });
        }

        private void NotificationClient_NotificationClicked(object sender, EventArgs e)
        {
            Dispatcher.Invoke(() =>
            {
                messageBox.Text += "Notification Clicked\n";
            });
        }

        private void NotificationClient_NotificationButtonClicked(object sender, EventArgs e)
        {
            Dispatcher.Invoke(() =>
            {
                messageBox.Text += "Notification Button Clicked\n";
            });
        }

        private void CreateButton_Click(object sender, RoutedEventArgs e)
        {
            var id = (sender as FrameworkElement).Name.Substring("create".Length);

            NotificationClient.Create($"wpf/{id}", new NotificationOptions
            {
                Title = $"WPF Alert {id}",
                Body = "Notification Body",
                Subtitle = "Subtitle",
                Buttons = new[]
                {
                    new NotificationButton() { Title = "Button1" },
                    new NotificationButton() { Title = "Button2" }
                }
            });
        }

        private void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            var id = (sender as FrameworkElement).Name.Substring("close".Length);
            NotificationClient.Clear($"wpf/{id}");
        }

        private void FetchButton_Click(object sender, RoutedEventArgs e)
        {
            var fetchResult = NotificationClient.GetAll().Result as JObject;

            var notificationArray = fetchResult["value"] as JArray;

            Dispatcher.Invoke(() =>
            {
                messageBox.Text += $"Got Notifications: {notificationArray.Count}\n";
            });
        }

        private void messageBox_MouseDown(object sender, MouseButtonEventArgs e)
        {
            messageBox.Text = "";
        }
    }
}
