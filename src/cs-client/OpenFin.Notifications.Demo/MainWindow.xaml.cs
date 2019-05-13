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

        private async void CreateButton_Click(object sender, RoutedEventArgs e)
        {
            var id = (sender as FrameworkElement).Name.Substring("create".Length);
            
            await NotificationClient.Create($"wpf/{id}", new NotificationOptions
            {
                Title = $"WPF Alert {id}",
                Body = "Notification Body",
                Subtitle = "Subtitle",
                Icon = "https://openfin.co/favicon-32x32.png",
                Buttons = new[]
                {
                    new NotificationButton() { Title = "Button1", Icon = "https://openfin.co/favicon-32x32.png"},
                    new NotificationButton() { Title = "Button2" }
                }
            });
        }

        private async void CloseButton_Click(object sender, RoutedEventArgs e)
        {
            var id = (sender as FrameworkElement).Name.Substring("close".Length);
            await NotificationClient.Clear($"wpf/{id}");
        }

        private async void FetchButton_Click(object sender, RoutedEventArgs e)
        {
            var fetchResult = await NotificationClient.GetAll();

            Dispatcher.Invoke(() =>
            {
                messageBox.Text += $"Got Notifications: {fetchResult.Length}\n";
            });
        }

        private void messageBox_MouseDown(object sender, MouseButtonEventArgs e)
        {
            messageBox.Text = "";
        }

        private void ToggleButton_Click(object sender, RoutedEventArgs e)
        {
            NotificationClient.ToggleNotificationCenter();
        }
    }
}
