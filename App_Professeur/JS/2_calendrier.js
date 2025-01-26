import { baseUrl } from "../../Configuration_Js/base-url.js";
import { calendarService } from `${baseUrl}App_Professeur/JS/services/2_calendrier.js`;
import { calendarModel } from `${baseUrl}App_Professeur/JS/models/2_calendrier.js`;
import { dbService } from "../../Configuration_Js/db-service.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";

// 日历状态管理
const calendarState = {
  currentDate: new Date(),
  selectedDate: null,
  events: [], // 本地事件
  dbEvents: [], // 数据库事件
  view: "month", // 'month', 'week', 'day'
};

// 初始化函数
export async function initialize() {
  try {
    // 确保日历容器存在
    const calendarContent = document.querySelector(".calendar-content");
    if (!calendarContent) {
      console.error("Calendar container not found");
      return;
    }

    // 初始化日历状态
    calendarState.currentDate = new Date();
    calendarState.events = [];
    calendarState.dbEvents = [];
    calendarState.view = "month";

    // 设置日历基本结构
    await setupCalendar();

    // 设置事件监听器
    setupEventListeners();

    // 只加载当前月份的事件
    await loadCurrentMonthEvents();

    // 更新日历显示
    updateCalendar();
  } catch (error) {
    console.error("Calendar initialization error:", error);
  }
}

// 优化：合并加载当前月份的所有事件
async function loadCurrentMonthEvents() {
  try {
    const startDate = new Date(
      calendarState.currentDate.getFullYear(),
      calendarState.currentDate.getMonth(),
      1
    );
    const endDate = new Date(
      calendarState.currentDate.getFullYear(),
      calendarState.currentDate.getMonth() + 1,
      0
    );

    // 并行加载课程和手动事件
    const [courseEvents, manualEvents] = await Promise.all([
      loadCourseEvents(startDate, endDate),
      loadManualEvents(startDate, endDate),
    ]);

    // 更新状态
    calendarState.events = courseEvents;
    calendarState.dbEvents = manualEvents;
  } catch (error) {
    console.error("Error loading current month events:", error);
  }
}

// 优化：加载课程事件
async function loadCourseEvents(startDate, endDate) {
  try {
    const studentProfiles = await dbService.query("student_profiles", {});
    if (!studentProfiles?.length) return [];

    const events = [];
    const processedProfiles = new Set(); // 用于跟踪已处理的档案

    for (const profile of studentProfiles) {
      // 避免重复处理相同的档案
      if (processedProfiles.has(profile.id)) continue;
      processedProfiles.add(profile.id);

      if (!profile.current_courses?.length) continue;

      for (const course of profile.current_courses) {
        if (!course?.schedule) continue;

        const courseStartDate = new Date(course.schedule.start_date);
        const courseEndDate = new Date(course.schedule.end_date);

        // 检查课程日期是否与当前月份重叠
        if (courseEndDate < startDate || courseStartDate > endDate) continue;

        try {
          const [startHour, startMinute] = course.schedule.start_time
            .split(":")
            .map(Number);
          const [endHour, endMinute] = course.schedule.end_time
            .split(":")
            .map(Number);

          if (course.schedule.is_weekly) {
            // 处理周期性课程
            const dayOfWeek = course.schedule.day_of_week
              ? course.schedule.day_of_week.charAt(0).toUpperCase() +
                course.schedule.day_of_week.slice(1).toLowerCase()
              : "";

            let currentDate = new Date(Math.max(startDate, courseStartDate));
            const finalEndDate = new Date(Math.min(endDate, courseEndDate));

            while (currentDate <= finalEndDate) {
              const currentDayName =
                currentDate
                  .toLocaleDateString("fr-FR", { weekday: "long" })
                  .charAt(0)
                  .toUpperCase() +
                currentDate
                  .toLocaleDateString("fr-FR", { weekday: "long" })
                  .slice(1)
                  .toLowerCase();

              if (currentDayName === dayOfWeek) {
                events.push(
                  createEventObject(
                    course,
                    profile,
                    currentDate,
                    startHour,
                    startMinute,
                    endHour,
                    endMinute,
                    true
                  )
                );
                currentDate.setDate(currentDate.getDate() + 7);
              } else {
                currentDate.setDate(currentDate.getDate() + 1);
              }
            }
          } else {
            // 处理单次课程
            events.push(
              createEventObject(
                course,
                profile,
                courseStartDate,
                startHour,
                startMinute,
                endHour,
                endMinute,
                false
              )
            );
          }
        } catch (error) {
          console.error("Error processing course:", course.title);
        }
      }
    }

    return events;
  } catch (error) {
    console.error("Error loading course events:", error);
    return [];
  }
}

// 优化：加载手动事件
async function loadManualEvents(startDate, endDate) {
  try {
    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const events = await calendarModel.loadEvents(
      formattedStartDate,
      formattedEndDate
    );

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description || "",
      start: new Date(event.start_timestamp || event.start),
      end: new Date(event.end_timestamp || event.end),
      type: event.event_type || "manual",
      color: event.color || "#4CAF50",
      isAllDay: event.is_all_day || false,
      status: event.status || "active",
      professor_id: event.professor_id,
      location: event.location || "",
    }));
  } catch (error) {
    console.error("Error loading manual events:", error);
    return [];
  }
}

// 辅助函数：创建事件对象
function createEventObject(
  course,
  profile,
  date,
  startHour,
  startMinute,
  endHour,
  endMinute,
  isWeekly
) {
  const eventStart = new Date(date);
  eventStart.setHours(startHour, startMinute);

  const eventEnd = new Date(date);
  eventEnd.setHours(endHour, endMinute);

  return {
    id: `${profile.id}_${course.course_id}${
      isWeekly ? "_" + date.toISOString() : ""
    }`,
    title: course.title || "Untitled Course",
    description: course.description || "",
    start: eventStart,
    end: eventEnd,
    type: "course",
    color: course.color || getEventColor(course.subject, "course"),
    subject: course.subject,
    isAllDay: false,
    professor_id: profile.assigned_professor_id,
    student_name: `${profile.first_name} ${profile.last_name}`,
    location: course.location || "",
    is_weekly: isWeekly,
    day_of_week: isWeekly ? course.schedule.day_of_week : null,
  };
}

// 设置日历
async function setupCalendar() {
  const calendarContent = document.querySelector(".calendar-content");
  if (!calendarContent) {
    throw new Error("Calendar content container not found!");
  }

  // 设置基本HTML结构
  calendarContent.innerHTML = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="prev-btn"><i class="fas fa-chevron-left"></i></button>
        <h2 class="current-month"></h2>
        <button class="next-btn"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="view-options">
        <button class="view-btn active" data-view="month">Mois</button>
        <button class="view-btn" data-view="week">Semaine</button>
        <button class="view-btn" data-view="day">Jour</button>
      </div>
      <button class="add-event-btn">
        <i class="fas fa-plus"></i>
        Ajouter un événement
      </button>
    </div>
    <div class="calendar-body">
      <div class="days"></div>
    </div>
    <div class="events-list">
      <h3>Événements à venir</h3>
      <div class="events-container"></div>
    </div>
  `;
}

// 设置事件监听器
function setupEventListeners() {
  const calendarContent = document.querySelector(".calendar-content");
  if (!calendarContent) return;

  // 导航按钮
  const prevBtn = calendarContent.querySelector(".prev-btn");
  const nextBtn = calendarContent.querySelector(".next-btn");
  prevBtn.addEventListener("click", () => navigateMonth(-1));
  nextBtn.addEventListener("click", () => navigateMonth(1));

  // 视图切换按钮
  const viewBtns = calendarContent.querySelectorAll(".view-btn");
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      calendarState.view = btn.dataset.view;
      updateViewButtons();
      await loadCurrentMonthEvents(); // 切换视图时重新加载事件
      updateCalendar();
    });
  });

  // 添加事件按钮
  const addEventBtn = calendarContent.querySelector(".add-event-btn");
  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => openEventModal());
  }

  // 日期点击
  const daysContainer = calendarContent.querySelector(".days");
  daysContainer.addEventListener("click", (e) => {
    const dayCell = e.target.closest(".day");
    if (dayCell && !dayCell.classList.contains("disabled")) {
      const date = new Date(dayCell.dataset.date);
      selectDate(date);
    }
  });
}

// 更新日历显示
function updateCalendar() {
  try {
    updateMonthDisplay();
    updateViewButtons();

    // 合并所有事件
    const allEvents = [...calendarState.events, ...calendarState.dbEvents].sort(
      (a, b) => new Date(a.start) - new Date(b.start)
    );

    // 根据当前视图渲染
    switch (calendarState.view) {
      case "month":
        renderMonthView(allEvents);
        break;
      case "week":
        renderWeekView(allEvents);
        break;
      case "day":
        renderDayView(allEvents);
        break;
    }

    // 更新即将到来的事件列表
    updateUpcomingEvents(allEvents);
  } catch (error) {
    console.error("Error updating calendar:", error);
  }
}

// 更新月份显示
function updateMonthDisplay() {
  const monthDisplay = document.querySelector(".current-month");
  if (monthDisplay) {
    const options = { year: "numeric", month: "long" };
    monthDisplay.textContent = calendarState.currentDate.toLocaleDateString(
      "fr-FR",
      options
    );
  }
}

// 渲染月视图
function renderMonthView(events) {
  const daysContainer = document.querySelector(".days");
  if (!daysContainer) return;

  const year = calendarState.currentDate.getFullYear();
  const month = calendarState.currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDay = new Date(firstDay);
  startDay.setDate(startDay.getDate() - ((firstDay.getDay() + 6) % 7));

  let currentDay = new Date(startDay);
  let calendarHtml = "";

  // 添加星期标题
  calendarHtml += '<div class="weekdays">';
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  weekDays.forEach((day) => {
    calendarHtml += `<div class="weekday">${day}</div>`;
  });
  calendarHtml += "</div>";

  // 添加日期和事件
  for (let week = 0; week < 6; week++) {
    calendarHtml += '<div class="week">';
    for (let day = 0; day < 7; day++) {
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = isSameDay(currentDay, new Date());
      const isSelected =
        calendarState.selectedDate &&
        isSameDay(currentDay, calendarState.selectedDate);
      const dayEvents = getEventsForDate(currentDay);

      calendarHtml += `
        <div class="day ${isCurrentMonth ? "" : "disabled"} 
                     ${isToday ? "today" : ""} 
                     ${isSelected ? "selected" : ""} 
                     ${dayEvents.length > 0 ? "has-events" : ""}"
             data-date="${currentDay.toISOString()}">
          <span class="date-number">${currentDay.getDate()}</span>
          <div class="day-events">
            ${dayEvents
              .sort((a, b) => new Date(a.start) - new Date(b.start))
              .slice(0, 3)
              .map((event) => createEventPreview(event))
              .join("")}
            ${
              dayEvents.length > 3
                ? `<div class="more-events">+${dayEvents.length - 3} plus</div>`
                : ""
            }
          </div>
        </div>`;

      currentDay.setDate(currentDay.getDate() + 1);
    }
    calendarHtml += "</div>";
  }

  daysContainer.innerHTML = calendarHtml;

  // 添加事件点击处理
  const eventPreviews = daysContainer.querySelectorAll(".event-preview");
  eventPreviews.forEach((eventPreview) => {
    eventPreview.addEventListener("click", (e) => {
      e.stopPropagation();
      const eventId = eventPreview.dataset.eventId;
      const event = calendarState.dbEvents.find(
        (e) => e.id === parseInt(eventId)
      );
      if (event) {
        showEventDetails(event);
      }
    });
  });
}

// 修改事件预览显示，使用透明背景
function createEventPreview(event) {
  // 确保事件颜色正确
  const eventColor = event.color || getEventColor(event.subject, event.type);

  // 格式化事件时间
  const startTime = new Date(event.start);
  const formattedTime = startTime.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 使用已有的CSS类名构建事件预览HTML，但不设置背景色
  const eventHtml = `
    <div class="event-preview" 
         data-event-id="${event.id}" 
         data-event-type="${event.type || "course"}"
         style="background: transparent; border-left: 3px solid ${eventColor}">
      <div class="event-time">${formattedTime}</div>
      <div class="event-title">${event.title}</div>
      ${
        event.student_name
          ? `<div class="event-student">👤 ${event.student_name}</div>`
          : ""
      }
      ${
        event.location
          ? `<div class="event-location">📍 ${event.location}</div>`
          : ""
      }
      ${
        event.subject ? `<div class="event-subject">${event.subject}</div>` : ""
      }
    </div>
  `;

  return eventHtml;
}

// 添加显示事件详情的函数
function showEventDetails(event) {
  const modalHtml = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${event.title}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>Date:</strong> ${new Date(event.start).toLocaleDateString(
          "fr-FR"
        )}</p>
        <p><strong>Heure:</strong> ${new Date(event.start).toLocaleTimeString(
          "fr-FR"
        )} - ${new Date(event.end).toLocaleTimeString("fr-FR")}</p>
        ${
          event.description
            ? `<p><strong>Description:</strong> ${event.description}</p>`
            : ""
        }
        ${
          event.location
            ? `<p><strong>Lieu:</strong> ${event.location}</p>`
            : ""
        }
      </div>
    </div>
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".close-modal");
  closeBtn.addEventListener("click", () => modal.remove());
}

// 渲染周视图
function renderWeekView(events) {
  const daysContainer = document.querySelector(".days");
  if (!daysContainer) return;

  const startOfWeek = getStartOfWeek(calendarState.currentDate);
  let currentDay = new Date(startOfWeek);

  let weekHtml = '<div class="week-view">';

  // 时间列
  weekHtml += '<div class="time-column">';
  for (let hour = 8; hour <= 18; hour++) {
    weekHtml += `<div class="hour">${hour}:00</div>`;
  }
  weekHtml += "</div>";

  // 每天的列
  for (let day = 0; day < 7; day++) {
    const isToday = isSameDay(currentDay, new Date());
    const dayEvents = getEventsForDate(currentDay);

    weekHtml += `
      <div class="day-column ${isToday ? "today" : ""}">
        <div class="day-header">
          ${currentDay
            .toLocaleDateString("fr-FR", { weekday: "short" })
            .toLowerCase()}.
          ${currentDay.getDate()}
        </div>
        <div class="day-grid">
    `;

    // 创建时间格子
    for (let hour = 8; hour <= 18; hour++) {
      weekHtml += `<div class="time-cell" data-hour="${hour}"></div>`;
    }

    // 在对应的时间格子中渲染事件
    dayEvents.forEach((event) => {
      const startHour = new Date(event.start).getHours();
      const endHour = new Date(event.end).getHours();
      const startMinutes = new Date(event.start).getMinutes();
      const endMinutes = new Date(event.end).getMinutes();

      // 计算事件应该跨越的格子数
      const startCell = startHour - 8;
      const duration = endHour - startHour;

      weekHtml += `
        <div class="event" 
             style="grid-row: ${
               startCell + 1
             } / span ${duration}; background-color: ${
        event.backgroundColor || "var(--primary-color)"
      };">
          <div class="event-title">${event.title}</div>
          <div class="event-time">${startHour}:${String(startMinutes).padStart(
        2,
        "0"
      )} - ${endHour}:${String(endMinutes).padStart(2, "0")}</div>
        </div>
      `;
    });

    weekHtml += "</div></div>";
    currentDay.setDate(currentDay.getDate() + 1);
  }

  weekHtml += "</div>";
  daysContainer.innerHTML = weekHtml;
}

// 渲染日视图
function renderDayView(events) {
  const daysContainer = document.querySelector(".days");
  if (!daysContainer) return;

  const dayEvents = getEventsForDate(calendarState.currentDate);

  let dayHtml = '<div class="day-view">';

  // 时间列
  dayHtml += '<div class="time-column">';
  for (let hour = 8; hour <= 18; hour++) {
    dayHtml += `<div class="hour">${hour}:00</div>`;
  }
  dayHtml += "</div>";

  // 事件列
  dayHtml += `
    <div class="events-column">
      <div class="day-header">
        ${calendarState.currentDate.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "long",
        })}
      </div>
      <div class="events-grid">
  `;

  // 创建时间格子
  for (let hour = 8; hour <= 18; hour++) {
    dayHtml += `<div class="time-cell" data-hour="${hour}"></div>`;
  }

  // 渲染事件
  dayEvents.forEach((event) => {
    const startHour = new Date(event.start).getHours();
    const endHour = new Date(event.end).getHours();
    const startMinutes = new Date(event.start).getMinutes();
    const endMinutes = new Date(event.end).getMinutes();

    // 计算事件应该跨越的格子数
    const startCell = startHour - 8;
    const duration = endHour - startHour;

    dayHtml += `
      <div class="event" 
           style="grid-row: ${
             startCell + 1
           } / span ${duration}; background-color: ${
      event.backgroundColor || "var(--primary-color)"
    };">
        <div class="event-title">${event.title}</div>
        <div class="event-time">${startHour}:${String(startMinutes).padStart(
      2,
      "0"
    )} - ${endHour}:${String(endMinutes).padStart(2, "0")}</div>
      </div>
    `;
  });

  dayHtml += "</div></div></div>";
  daysContainer.innerHTML = dayHtml;
}

// 更新事件列表
function updateEventsList() {
  const eventsContainer = document.querySelector(".events-container");
  if (!eventsContainer) return;

  const upcomingEvents = getUpcomingEvents();

  if (upcomingEvents.length === 0) {
    eventsContainer.innerHTML =
      '<p class="no-events">Aucun événement à venir</p>';
    return;
  }

  eventsContainer.innerHTML = upcomingEvents
    .map(
      (event) => `
      <div class="event-item">
        <div class="event-title">${event.title}</div>
        <div class="event-time">
          ${new Date(event.start).toLocaleDateString("fr-FR")} 
          ${new Date(event.start).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    `
    )
    .join("");
}

// 打开事件模态框
function openEventModal(date = null) {
  const modalHtml = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Nouvel événement</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="event-form">
          <div class="form-group">
            <label>Titre</label>
            <input type="text" name="title" required>
          </div>
          <div class="form-group">
            <label>Date de début</label>
            <input type="datetime-local" name="start" value="${formatDateTimeLocal(
              date || new Date()
            )}" required>
          </div>
          <div class="form-group">
            <label>Date de fin</label>
            <input type="datetime-local" name="end" value="${formatDateTimeLocal(
              date
                ? new Date(date.getTime() + 3600000)
                : new Date(Date.now() + 3600000)
            )}" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" rows="3"></textarea>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn">Annuler</button>
        <button class="save-btn">Enregistrer</button>
      </div>
    </div>
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  // 添加事件监听器
  const closeBtn = modal.querySelector(".close-modal");
  const cancelBtn = modal.querySelector(".cancel-btn");
  const saveBtn = modal.querySelector(".save-btn");
  const form = modal.querySelector("#event-form");

  closeBtn.addEventListener("click", () => modal.remove());
  cancelBtn.addEventListener("click", () => modal.remove());

  saveBtn.addEventListener("click", async () => {
    console.log("=== Event Save Process Started ===");

    if (form.checkValidity()) {
      const formData = new FormData(form);

      // 打印原始表单数据
      console.log("Raw form data:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // 提取并验证日期时间
      const startDateTime = formData.get("start");
      const endDateTime = formData.get("end");

      console.log("Extracted date/time:", {
        startDateTime,
        endDateTime,
      });

      try {
        // 获取用户ID
        console.log("Getting current user ID...");
        const userId = await getCurrentUserId();
        console.log("User ID obtained:", userId);

        // 创建事件对象
        const eventData = {
          title: formData.get("title"),
          description: formData.get("description"),
          start_date: startDateTime.split("T")[0],
          end_date: endDateTime.split("T")[0],
          start_time: startDateTime.split("T")[1].substring(0, 5),
          end_time: endDateTime.split("T")[1].substring(0, 5),
          color: "#4CAF50",
          user_id: userId,
          professor_id: userId,
          status: "active",
          location: null,
          is_all_day: 0,
        };

        console.log("Prepared event data:", eventData);

        // 保存到数据库
        console.log("Saving to database...");
        await saveEvent(formData);
        console.log("Successfully saved to database");

        // 更新界面
        console.log("Updating UI...");
        await loadCurrentMonthEvents();
        updateCalendar();
        updateUpcomingEvents();
        console.log("UI updated successfully");

        // 关闭模态框
        modal.remove();
        console.log("=== Event Save Process Completed ===");
      } catch (error) {
        console.error("=== Event Save Process Failed ===");
        console.error("Error details:", error);
        console.error("Error stack:", error.stack);
        alert("Erreur lors de l'enregistrement de l'événement");
      }
    } else {
      console.log("Form validation failed");
      form.reportValidity();
    }
  });
}

// 获取即将到来的事件
function getUpcomingEvents() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  // 重置时间部分以便比较日期
  now.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  const events = [...calendarState.events, ...calendarState.dbEvents];

  // 过滤并按日期和时间排序
  return events
    .filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= now && eventDate < dayAfterTomorrow;
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .map((event) => ({
      ...event,
      type: event.type || "course",
      color: event.color || getEventColor(event.subject, event.type),
      // 添加日期标记以便后续分组
      dateString: new Date(event.start).toLocaleDateString("fr-FR"),
    }));
}

// 更新即将到来的事件列表
function updateUpcomingEvents(events) {
  const upcomingEvents = getUpcomingEvents(events);
  const eventsContainer = document.querySelector(".events-container");

  if (!eventsContainer || upcomingEvents.length === 0) {
    if (eventsContainer) {
      eventsContainer.innerHTML =
        '<div class="no-events">Aucun événement à venir</div>';
    }
    return;
  }

  // 按日期分组事件
  let currentDate = "";
  let html = "";

  upcomingEvents.forEach((event, index) => {
    const eventDate = event.dateString;

    // 如果是新的一天，添加日期标题
    if (eventDate !== currentDate) {
      // 如果不是第一个日期，添加分隔线
      if (currentDate !== "") {
        html += '<div class="day-separator"></div>';
      }

      html += `<div class="day-header">${eventDate}</div>`;
      currentDate = eventDate;
    }

    // 添加事件项
    html += `
      <div class="event-item">
        <div class="event-time">${formatEventTime(event.start)}</div>
        <div class="event-title">${event.title}</div>
        ${
          event.location
            ? `<div class="event-location">📍 ${event.location}</div>`
            : ""
        }
      </div>
    `;
  });

  eventsContainer.innerHTML = html;
}

// 获取指定日期的事件
function getEventsForDate(date) {
  const events = [...calendarState.events, ...calendarState.dbEvents];

  const filteredEvents = events
    .filter((event) => {
      try {
        // 标准化日期对象
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const eventStart = new Date(event.start);
        const startDate = new Date(eventStart);
        startDate.setHours(0, 0, 0, 0);

        const eventEnd = new Date(event.end);
        const endDate = new Date(eventEnd);
        endDate.setHours(0, 0, 0, 0);

        // 如果是每周重复的事件
        if (event.is_weekly) {
          // 标准化当前日期的星期几名称：首字母大写，其余小写
          const currentDayName =
            checkDate
              .toLocaleDateString("fr-FR", { weekday: "long" })
              .charAt(0)
              .toUpperCase() +
            checkDate
              .toLocaleDateString("fr-FR", { weekday: "long" })
              .slice(1)
              .toLowerCase();

          // 标准化事件的星期几名称
          const eventDayName = event.day_of_week
            ? event.day_of_week.charAt(0).toUpperCase() +
              event.day_of_week.slice(1).toLowerCase()
            : "";

          const isValidDay = currentDayName === eventDayName;
          const isWithinRange =
            checkDate.getTime() >= startDate.getTime() &&
            checkDate.getTime() <= endDate.getTime();

          // 只对匹配的事件输出详细日志
          if (isValidDay && isWithinRange) {
            console.log("Found matching weekly event:", {
              title: event.title,
              currentDay: currentDayName,
              eventDay: eventDayName,
            });
          }

          return isValidDay && isWithinRange;
        } else {
          const isSameDay = checkDate.getTime() === startDate.getTime();

          // 只对匹配的事件输出详细日志
          if (isSameDay) {
            console.log("Found matching single event:", {
              title: event.title,
            });
          }

          return isSameDay;
        }
      } catch (error) {
        console.error("Error processing event:", event.title);
        return false;
      }
    })
    .map((event) => ({
      ...event,
      type: event.type || "course",
      color: event.color || getEventColor(event.subject, event.type),
      start: new Date(event.start),
      end: new Date(event.end),
    }));

  return filteredEvents;
}

// 添加事件
function addEvent(event) {
  calendarState.events.push(event);
  updateCalendar();
}

// 选择日期
function selectDate(date) {
  calendarState.selectedDate = date;
  updateCalendar();
  openEventModal(date);
}

// 导航月份
async function navigateMonth(delta) {
  try {
    const newDate = new Date(calendarState.currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    calendarState.currentDate = newDate;

    // 重新加载事件
    await loadCurrentMonthEvents();

    // 更新显示
    updateCalendar();
  } catch (error) {
    console.error("Error navigating month:", error);
  }
}

// 更新视图按钮状态
function updateViewButtons() {
  const viewBtns = document.querySelectorAll(".view-btn");
  viewBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === calendarState.view);
  });
}

// 工具函数：检查是否是同一天
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 工具函数：获取周的开始日期
function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

// 工具函数：格式化日期时间为本地格式
function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// 工具函数：格式化事件时间显示
function formatEventTime(date) {
  const eventDate = new Date(date);
  return eventDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 辅助函数

// 合并日期和时间
function combineDateAndTime(dateStr, timeStr) {
  const date = new Date(dateStr);
  const [hours, minutes] = timeStr.split(":");
  date.setHours(parseInt(hours), parseInt(minutes));
  return date;
}

// 获取星期几的数字表示
function getWeekDayNumber(dayName) {
  const days = {
    Lundi: 1,
    Mardi: 2,
    Mercredi: 3,
    Jeudi: 4,
    Vendredi: 5,
    Samedi: 6,
    Dimanche: 0,
  };
  return days[dayName];
}

// 根据课程科目获取事件颜色
function getEventColor(subject, eventType) {
  if (eventType === "manual" || eventType === "manual_event") {
    return "#4CAF50"; // 手动事件为绿色
  }

  // 根据科目设置不同颜色
  const subjectColors = {
    math: "#2196F3", // 蓝色
    physics: "#F44336", // 红色
    chemistry: "#9C27B0", // 紫色
    info: "#FF9800", // 橙色
  };

  return subjectColors[subject] || "var(--primary-color)";
}

// 获取当前用户ID
async function getCurrentUserId() {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("User not authenticated");
    return user.id;
  } catch (error) {
    console.error("Failed to get current user:", error);
    throw error;
  }
}

async function saveEvent(formData) {
  try {
    console.log("=== Event Save Process Started ===");
    console.log("Saving event with form data:", formData);

    // 获取当前用户信息并验证
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError) throw new Error("Failed to get user information");
    if (!user) throw new Error("No authenticated user found");

    // 验证用户类型
    const { data: userData, error: profileError } = await supabaseClient
      .from("users")
      .select("user_type, status")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("Failed to get user profile");
    if (!userData) throw new Error("User profile not found");
    if (userData.user_type !== "tutor")
      throw new Error("Only tutors can create events");
    if (userData.status !== "active")
      throw new Error("User account is not active");

    // 从datetime-local输入中获取值
    const startDateTime = formData.get("start");
    const endDateTime = formData.get("end");

    // 验证日期时间
    if (!startDateTime || !endDateTime) {
      throw new Error("Start and end date/time are required");
    }

    // 格式化事件数据
    const eventData = {
      title: formData.get("title").trim(),
      description: formData.get("description")?.trim() || "",
      start: startDateTime, // 保持完整的datetime-local格式
      end: endDateTime, // 保持完整的datetime-local格式
      color: "#4CAF50",
      user_id: user.id,
      status: "active",
      location: formData.get("location")?.trim() || null,
      is_all_day: formData.get("is_all_day") === "true" ? 1 : 0,
    };

    // 验证必填字段
    if (!eventData.title) throw new Error("Title is required");

    console.log("Formatted event data:", eventData);

    // 保存到数据库
    console.log("Saving to database...");
    const savedEvent = await calendarModel.addEvent(eventData);
    console.log("Event saved successfully:", savedEvent);

    // 刷新日历显示
    await loadCurrentMonthEvents();
    updateCalendar();

    return savedEvent;
  } catch (error) {
    console.error("Error saving event:", error);
    // 显示用户友好的错误消息
    let errorMessage = "Erreur lors de l'enregistrement de l'événement";
    if (error.message.includes("Only tutors")) {
      errorMessage = "Seuls les tuteurs peuvent créer des événements";
    } else if (error.message.includes("not active")) {
      errorMessage = "Votre compte n'est pas actif";
    } else if (error.message.includes("Start and end")) {
      errorMessage = "Les dates de début et de fin sont obligatoires";
    } else if (error.message.includes("Title is required")) {
      errorMessage = "Le titre est obligatoire";
    }
    alert(errorMessage);
    throw error;
  }
}

// 添加辅助函数：获取星期几的名称
function getWeekDayName(dayNumber) {
  const days = {
    1: "Lundi",
    2: "Mardi",
    3: "Mercredi",
    4: "Jeudi",
    5: "Vendredi",
    6: "Samedi",
    0: "Dimanche",
  };
  return days[dayNumber];
}
