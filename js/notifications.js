class NotificationManager {
  constructor() {
    this.container = null;
    this.createContainer();
  }
  createContainer() {
    this.container = document.createElement("div");
    this.container.id = "notification-container";
    this.container.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(this.container);
  }
  show(message, type = "info", duration = 4000) {
    const notification = document.createElement("div");
    notification.className = this.getNotificationClasses(type);
    const icon = this.getIcon(type);
    notification.innerHTML = `<div class="flex items-center"><div class="flex-shrink-0"><i class="${icon} w-5 h-5"></i></div><div class="ml-3"><p class="text-sm font-medium">${message}</p></div><div class="ml-4 flex-shrink-0"><button class="close-btn inline-flex text-current hover:opacity-75 focus:outline-none"><i class="bi bi-x w-5 h-5"></i></button></div></div>`;
    this.container.appendChild(notification);
    const closeBtn = notification.querySelector(".close-btn");
    closeBtn.addEventListener("click", () => this.remove(notification));
    setTimeout(() => {
      if (notification.parentNode) {
        this.remove(notification);
      }
    }, duration);
    requestAnimationFrame(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    });
    return notification;
  }
  remove(notification) {
    notification.style.transform = "translateX(100%)";
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        this.container.removeChild(notification);
      }
    }, 300);
  }
  getNotificationClasses(type) {
    const baseClasses =
      "transform transition-all duration-300 ease-in-out translate-x-full opacity-0 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4";
    const typeClasses = {
      success: "border-green-200 bg-green-50 text-green-800",
      error: "border-red-200 bg-red-50 text-red-800",
      warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
      info: "border-blue-200 bg-blue-50 text-blue-800",
    };
    return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
  }
  getIcon(type) {
    const icons = {
      success: "bi bi-check-circle",
      error: "bi bi-exclamation-triangle",
      warning: "bi bi-exclamation-circle",
      info: "bi bi-info-circle",
    };
    return icons[type] || icons.info;
  }
  success(message, duration) {
    return this.show(message, "success", duration);
  }
  error(message, duration) {
    return this.show(message, "error", duration);
  }
  warning(message, duration) {
    return this.show(message, "warning", duration);
  }
  info(message, duration) {
    return this.show(message, "info", duration);
  }
}
window.notifications = new NotificationManager();
