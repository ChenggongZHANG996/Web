// 导入数据库服务
import { dbService } from "../../Configuration_Js/db-service.js";

// 存储课程数据的变量
let COURSES_DATA = [];

// 日志系统
const Logger = {
  styles: {
    info: "background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;",
    success:
      "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;",
    warning:
      "background: #FFC107; color: black; padding: 2px 5px; border-radius: 3px;",
    error:
      "background: #F44336; color: white; padding: 2px 5px; border-radius: 3px;",
    validation:
      "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px;",
    data: "background: #FF5722; color: white; padding: 2px 5px; border-radius: 3px;",
  },

  info: (message) => {
    console.log("%c INFO ", Logger.styles.info, message);
  },

  success: (message) => {
    console.log("%c SUCCESS ", Logger.styles.success, message);
  },

  warning: (message) => {
    console.log("%c WARNING ", Logger.styles.warning, message);
  },

  error: (message, error = null) => {
    console.log("%c ERROR ", Logger.styles.error, message);
    if (error) {
      console.error(error);
    }
  },

  validation: (message) => {
    console.log("%c VALIDATION ", Logger.styles.validation, message);
  },

  data: (label, data) => {
    console.log("%c DATA ", Logger.styles.data, `${label}:`, data);
  },
};

// 初始化函数
async function initialize() {
  console.log("Initializing courses page...");
  await loadCoursesFromDB();
  setupEventListeners();
}

// 从数据库加载课程
async function loadCoursesFromDB() {
  try {
    Logger.info("Loading courses and student profiles from database...");

    // 获取所有学生档案
    const studentProfiles = await dbService.query("student_profiles", {});

    // 提取当前课程信息 - 每个学生的第一门课
    const coursesData = [];
    studentProfiles.forEach((profile) => {
      if (
        profile.current_courses &&
        Array.isArray(profile.current_courses) &&
        profile.current_courses.length > 0
      ) {
        // 获取每个学生的第一门课程
        const currentCourse = profile.current_courses[0];

        coursesData.push({
          id: currentCourse.course_id,
          title: currentCourse.title,
          level: profile.study_level,
          date: `${formatDateFromSchedule(currentCourse.schedule)}`,
          schedule: `${currentCourse.schedule.day} ${currentCourse.schedule.start} - ${currentCourse.schedule.end}`,
          student: `${profile.first_name} ${profile.last_name}`,
          progress: `${profile.overall_progress || 0}`,
          status: convertStatus(currentCourse.status),
        });
      }
    });

    COURSES_DATA = coursesData;
    Logger.success(`Loaded ${COURSES_DATA.length} courses from database`);
    loadCourses();
  } catch (error) {
    Logger.error("Failed to load courses from database", error);
    showNotification("Erreur lors du chargement des cours", "error");
  }
}

// 从课程时间表中格式化日期
function formatDateFromSchedule(schedule) {
  const now = new Date();
  const year = now.getFullYear();
  return `${now.getDate()} ${now.toLocaleString("fr-FR", {
    month: "short",
  })}. ${year}`;
}

// 转换状态格式
function convertStatus(status) {
  const statusMap = {
    active: "en-cours",
    "à venir": "a-venir",
    terminé: "termine",
  };
  return statusMap[status] || status;
}

// 加载课程列表
function loadCourses(filters = {}) {
  const coursesList = document.querySelector(".courses-list");
  if (!coursesList) return;

  let filteredCourses = filterCourses(COURSES_DATA, filters);
  coursesList.innerHTML = filteredCourses
    .map((course) => createCourseCard(course))
    .join("");
}

// 过滤课程
function filterCourses(courses, filters) {
  return courses.filter((course) => {
    if (
      filters.level &&
      filters.level !== "all" &&
      !course.level.toLowerCase().includes(filters.level)
    ) {
      return false;
    }
    if (
      filters.subject &&
      filters.subject !== "all" &&
      !course.title.toLowerCase().includes(filters.subject)
    ) {
      return false;
    }
    if (
      filters.status &&
      filters.status !== "all" &&
      course.status !== filters.status
    ) {
      return false;
    }
    return true;
  });
}

// 设置事件监听器
function setupEventListeners() {
  // 过滤器变化事件
  const filters = document.querySelectorAll(".filter-group select");
  filters.forEach((filter) => {
    filter.addEventListener("change", handleFilterChange);
  });

  // 添加课程按钮事件
  const addButton = document.querySelector(".add-course-btn");
  if (addButton) {
    addButton.addEventListener("click", () => {
      const modal = document.getElementById("course-modal");
      if (modal) modal.style.display = "block";
    });
  }

  // 模态框关闭按钮事件
  const closeButtons = document.querySelectorAll(".close-modal, .cancel-btn");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modal = document.getElementById("course-modal");
      if (modal) modal.style.display = "none";
    });
  });

  // 保存课程按钮事件
  const saveButton = document.querySelector(".save-btn");
  if (saveButton) {
    saveButton.addEventListener("click", handleSaveCourse);
  }

  // 课程卡片点击事件
  document
    .querySelector(".courses-list")
    ?.addEventListener("click", handleCourseClick);
}

// 处理过滤器变化
function handleFilterChange() {
  const filters = {
    level: document.getElementById("level-filter").value,
    subject: document.getElementById("subject-filter").value,
    status: document.getElementById("status-filter").value,
  };
  loadCourses(filters);
}

// 处理保存课程
async function handleSaveCourse() {
  const form = document.getElementById("course-form");
  if (!form) {
    Logger.error("Form not found!");
    return;
  }

  Logger.info("Starting course save process...");

  // 表单验证
  if (form.checkValidity()) {
    Logger.validation("Form validation passed");
    const formData = new FormData(form);

    // 构建课程数据
    const courseData = {
      title: formData.get("title"),
      description: formData.get("description"),
      level: formData.get("level"),
      subject: formData.get("subject"),
      start_date: formData.get("startDate"),
      end_date: formData.get("endDate"),
      course_day: formData.get("courseDay"),
      course_time_start: formData.get("courseTimeStart"),
      course_time_end: formData.get("courseTimeEnd"),
      professor_id: "c7d52a50-3cff-484e-bf2b-8aa7d35389a3",
      professor_name: "Chenggong ZHANG",
      capacity: parseInt(formData.get("capacity")),
      status: "à venir",
      progression: 0,
    };

    // 记录课程数据
    Logger.data("Course Data:", courseData);

    try {
      Logger.info("Saving course to database...");
      const result = await dbService.insert("professor_courses", courseData);

      if (result) {
        Logger.success("Course saved successfully!");

        // 重新从数据库加载所有课程
        await loadCoursesFromDB();

        // 关闭模态框并重置表单
        const modal = document.getElementById("course-modal");
        if (modal) {
          modal.style.display = "none";
          form.reset();
        }

        showNotification("Cours ajouté avec succès!", "success");
      }
    } catch (error) {
      Logger.error("Failed to save course", error);
      showNotification(
        `Erreur lors de l'ajout du cours: ${error.message}`,
        "error"
      );
    }
  } else {
    Logger.validation("Form validation failed");
    form.reportValidity();
  }
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("fr-FR", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}. ${year}`;
}

// 显示通知的辅助函数
function showNotification(message, type = "info") {
  Logger.info(`Showing notification: ${message} (${type})`);
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
    Logger.info("Notification removed");
  }, 3000);
}

// 处理课程卡片点击
function handleCourseClick(event) {
  const card = event.target.closest(".course-card");
  if (!card) return;

  // 这里添加课程卡片点击的逻辑
  console.log("Course clicked:", card.dataset.id);
}

// 创建课程卡片的函数
function createCourseCard(course) {
  const progressValue = parseInt(course.progress) || 0;

  return `
    <div class="course-card" data-id="${course.id}">
      <div class="course-header">
        <h3>${course.title}</h3>
        <span class="status-badge ${course.status}">${getStatusLabel(
    course.status
  )}</span>
      </div>
      <div class="course-info">
        <p class="course-level">
          <i class="fas fa-graduation-cap"></i>
          ${course.level}
        </p>
        <p class="course-date">
          <i class="fas fa-calendar"></i>
          ${course.date}
        </p>
        <p class="course-time">
          <i class="fas fa-clock"></i>
          ${course.schedule}
        </p>
        <p class="course-student">
          <i class="fas fa-user"></i>
          ${course.student}
        </p>
      </div>
      <div class="course-progress">
        <div class="progress-text">Progression</div>
        <div class="progress-value">${progressValue}%</div>
        <div class="progress-bar">
          <div class="progress" style="width: ${progressValue}%"></div>
        </div>
      </div>
    </div>
  `;
}

// 获取状态标签
function getStatusLabel(status) {
  const statusLabels = {
    "en-cours": "En cours",
    "a-venir": "À venir",
    termine: "Terminé",
  };
  return statusLabels[status] || status;
}

// 保存事件到数据库
async function saveEvent(eventData) {
  try {
    // 构建事件数据
    const formattedEventData = {
      title: eventData.title,
      description: eventData.description || "",
      start_timestamp: eventData.start,
      end_timestamp: eventData.end,
      color: eventData.color || "#4CAF50",
      location: eventData.location || "",
      is_all_day: eventData.is_all_day || 0,
    };

    // 保存事件
    const result = await calendarModel.addEvent(formattedEventData);
    console.log("Event saved successfully:", result);

    // 刷新日历显示
    if (window.calendar) {
      // 转换事件格式以适配日历显示
      const calendarEvent = {
        id: result.id,
        title: result.title,
        start: result.start_timestamp,
        end: result.end_timestamp,
        color: result.color,
        extendedProps: {
          description: result.description,
          location: result.location,
          is_all_day: result.is_all_day,
          event_type: "manual",
        },
      };

      // 添加事件到日历
      window.calendar.addEvent(calendarEvent);
      // 重新渲染日历
      window.calendar.render();
    }

    return result;
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
}

// 初始化日历
function initializeCalendar(calendarEl) {
  const calendar = new FullCalendar.Calendar(calendarEl, {
    // ... 其他配置 ...
    eventDidMount: function (info) {
      // 为事件添加工具提示
      const tooltip = new Tooltip(info.el, {
        title: `${info.event.title}${
          info.event.extendedProps.description
            ? "\n" + info.event.extendedProps.description
            : ""
        }${
          info.event.extendedProps.location
            ? "\n📍 " + info.event.extendedProps.location
            : ""
        }`,
        placement: "top",
        trigger: "hover",
        container: "body",
      });
    },
    events: async function (info, successCallback, failureCallback) {
      try {
        // 获取日期范围内的所有事件
        const events = await calendarModel.loadEvents(
          info.startStr.split("T")[0],
          info.endStr.split("T")[0]
        );

        // 转换事件格式以适配日历显示
        const formattedEvents = events.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.start || event.start_timestamp,
          end: event.end || event.end_timestamp,
          color: event.color,
          extendedProps: {
            description: event.description,
            location: event.location,
            is_all_day: event.is_all_day,
            event_type: event.event_type,
          },
        }));

        successCallback(formattedEvents);
      } catch (error) {
        console.error("Error loading events:", error);
        failureCallback(error);
      }
    },
  });

  window.calendar = calendar;
  return calendar;
}

export { initialize };
