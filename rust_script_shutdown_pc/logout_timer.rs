use std::io::{self, Write};
use std::thread;
use std::time::Duration;
use std::process::Command;

fn main() {
    println!("You have 1 minute to enter the correct password or you will be logged out.");
    
    let password_thread = thread::spawn(|| {
        let mut password = String::new();
        print!("Enter password: ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut password).unwrap();
        password.trim().to_string()
    });

    thread::sleep(Duration::from_secs(60));

    if let Ok(entered_password) = password_thread.try_join() {
        if entered_password == "your_password_here" {
            println!("Correct password entered. Exiting.");
            return;
        }
    }

    println!("Time's up or incorrect password. Logging out...");
    logout();
}

fn logout() {
    #[cfg(target_os = "windows")]
    {
        Command::new("shutdown")
            .args(&["/l"])
            .output()
            .expect("Failed to execute logout command");
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("osascript")
            .args(&["-e", "tell application \"System Events\" to log out"])
            .output()
            .expect("Failed to execute logout command");
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("gnome-session-quit")
            .args(&["--logout", "--no-prompt"])
            .output()
            .expect("Failed to execute logout command");
    }
}