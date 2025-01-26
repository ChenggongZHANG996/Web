import { dbService } from "../../Configuration_Js/db-service.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";

// 获取最近两天的课程
async function getUpcomingCourses() {
  try {
    const now = new Date();
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // 重置时间部分以便比较日期
    now.setHours(0, 0, 0, 0);
    dayAfterTomorrow.setHours(0, 0, 0, 0);

    // 获取学生档案
    const studentProfiles = await dbService.query("student_profiles", {});
    if (!studentProfiles?.length) return [];

    const courses = [];
    const processedProfiles = new Set(); // 避免重复处理

    for (const profile of studentProfiles) {
      if (processedProfiles.has(profile.id)) continue;
      processedProfiles.add(profile.id);

      if (!profile.current_courses?.length) continue;

      for (const course of profile.current_courses) {
        if (!course?.schedule) continue;

        const courseStartDate = new Date(course.schedule.start_date);
        const courseEndDate = new Date(course.schedule.end_date);

        // 检查课程是否在日期范围内
        if (courseEndDate < now || courseStartDate > dayAfterTomorrow) continue;

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

            let currentDate = new Date(Math.max(now, courseStartDate));
            const finalEndDate = new Date(
              Math.min(dayAfterTomorrow, courseEndDate)
            );

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
                courses.push(
                  createCourseObject(
                    course,
                    profile,
                    currentDate,
                    startHour,
                    startMinute,
                    endHour,
                    endMinute
                  )
                );
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          } else {
            // 处理单次课程
            if (courseStartDate >= now && courseStartDate < dayAfterTomorrow) {
              courses.push(
                createCourseObject(
                  course,
                  profile,
                  courseStartDate,
                  startHour,
                  startMinute,
                  endHour,
                  endMinute
                )
              );
            }
          }
        } catch (error) {
          console.error("Error processing course:", course.title);
        }
      }
    }

    // 按时间排序
    return courses.sort((a, b) => a.start - b.start);
  } catch (error) {
    console.error("Error getting upcoming courses:", error);
    return [];
  }
}

// 创建课程对象
function createCourseObject(
  course,
  profile,
  date,
  startHour,
  startMinute,
  endHour,
  endMinute
) {
  const startDate = new Date(date);
  startDate.setHours(startHour, startMinute);

  const endDate = new Date(date);
  endDate.setHours(endHour, endMinute);

  return {
    id: `${profile.id}_${course.course_id}`,
    title: course.title || "Untitled Course",
    description: course.description || "",
    start: startDate,
    end: endDate,
    subject: course.subject,
    student_name: `${profile.first_name} ${profile.last_name}`,
    location: course.location || "",
    color: getSubjectColor(course.subject),
  };
}

// 获取科目颜色
function getSubjectColor(subject) {
  const colors = {
    math: "#2196F3",
    physics: "#F44336",
    chemistry: "#9C27B0",
    info: "#FF9800",
  };
  return colors[subject] || "#4CAF50";
}

// 格式化时间
function formatTime(date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// 更新课程显示
async function updateUpcomingCourses() {
  const coursesContainer = document.querySelector(".upcoming-courses");
  if (!coursesContainer) return;

  const courses = await getUpcomingCourses();

  if (courses.length === 0) {
    coursesContainer.innerHTML =
      '<div class="no-courses">Aucun cours prévu pour les prochaines 48 heures</div>';
    return;
  }

  // 按日期分组课程
  let currentDate = "";
  let html = "";

  courses.forEach((course) => {
    const courseDate = course.start.toLocaleDateString("fr-FR");

    // 如果是新的一天，添加日期分隔符
    if (courseDate !== currentDate) {
      if (currentDate !== "") {
        html += '<div class="day-separator"></div>';
      }
      currentDate = courseDate;
    }

    // 创建课程卡片
    html += `
      <div class="course-card" style="border-left-color: ${course.color}">
        <div class="course-time-section">
          <div class="course-time">${formatTime(course.start)} - ${formatTime(
      course.end
    )}</div>
          <div class="course-date">${courseDate}</div>
        </div>
        <div class="course-main-info">
          <div class="course-title">${course.title}</div>
          <div class="course-info">
            <div class="course-student">
              <i class="fas fa-user"></i>
              ${course.student_name}
            </div>
            ${
              course.location
                ? `
              <div class="course-location">
                <i class="fas fa-map-marker-alt"></i>
                ${course.location}
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
  });

  coursesContainer.innerHTML = html;
}

// 加载课程申请
async function loadCourseRequests() {
  try {
    const container = document.querySelector(".requests-container");
    if (!container) return;

    // 获取课程申请数据，按创建时间降序排列
    const requests = await dbService.queryOrdered(
      "course_requests",
      "created_at",
      false
    );
    if (!requests) {
      console.error("Failed to load course requests");
      container.innerHTML =
        '<div class="no-requests">Aucune demande de cours</div>';
      return;
    }

    // 渲染申请卡片
    container.innerHTML = requests
      .map(
        (request) => `
        <div class="request-card" data-request-id="${request.id}">
          <div class="request-header">
            <h3>${request.title || "Sans titre"}</h3>
            <span class="status ${request.status.toLowerCase()}">${
          request.status
        }</span>
          </div>
          <div class="request-info">
            <p><i class="fas fa-user"></i> ${request.student_name}</p>
            <p><i class="fas fa-envelope"></i> ${request.student_email}</p>
            <p><i class="fas fa-graduation-cap"></i> ${request.study_level}</p>
            <p><i class="fas fa-calendar"></i> ${new Date(
              request.request_date
            ).toLocaleDateString("fr-FR")}</p>
          </div>
          <div class="request-message">
            <i class="fas fa-quote-left"></i> ${
              request.message || "Pas de message"
            }
          </div>
          ${
            request.status === "En attente"
              ? `
            <div class="request-actions">
              <button class="request-btn accept-btn" onclick="window.handleRequestAction(${request.id}, 'accept')">
                <i class="fas fa-check"></i> Accepter
              </button>
              <button class="request-btn reject-btn" onclick="window.handleRequestAction(${request.id}, 'reject')">
                <i class="fas fa-times"></i> Refuser
              </button>
            </div>
          `
              : ""
          }
        </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Error loading course requests:", error);
    showNotification("Erreur lors du chargement des demandes", "error");
  }
}

// 处理课程申请的操作
async function handleRequestAction(requestId, action) {
  try {
    console.log(`Processing request ${requestId} with action: ${action}`);
    const newStatus = action === "accept" ? "Accepté" : "Refusé";

    // 先禁用按钮，防止重复点击
    const requestElement = document.querySelector(
      `[data-request-id="${requestId}"]`
    );
    if (requestElement) {
      const buttons = requestElement.querySelectorAll(".request-btn");
      buttons.forEach((btn) => (btn.disabled = true));
    }

    // 获取当前教师ID（使用固定的教师ID）
    const teacherId = "c7d52a50-3cff-484e-bf2b-8aa7d35389a3";

    // 获取课程申请信息
    const request = await dbService.query("course_requests", { id: requestId });
    if (!request || !request[0]) {
      throw new Error("Course request not found");
    }

    // 获取学生ID
    const studentId = "e1d5ab30-4f72-4aef-b25d-5c956ecc99a1";

    // 更新数据库
    const result = await dbService.update(
      "course_requests",
      {
        status: newStatus,
        updated_at: new Date().toISOString(),
        professor_id: teacherId,
        student_id: studentId,
      },
      {
        id: requestId,
        status: "En attente",
      }
    );

    console.log("Database update result:", result);

    // 等待一小段时间确保数据库更新完成
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 验证更新是否成功
    const updatedRequest = await dbService.query("course_requests", {
      id: requestId,
    });
    console.log("Verification query result:", updatedRequest);

    if (updatedRequest && updatedRequest[0]?.status === newStatus) {
      // 更新UI
      if (requestElement) {
        const statusElement = requestElement.querySelector(".status");
        if (statusElement) {
          statusElement.textContent = newStatus;
          statusElement.className = `status ${newStatus.toLowerCase()}`;
        }

        // 移除操作按钮
        const actionsElement = requestElement.querySelector(".request-actions");
        if (actionsElement) {
          actionsElement.remove();
        }
      }

      showNotification(
        action === "accept" ? "Demande acceptée" : "Demande refusée",
        "success"
      );

      // 重新加载申请列表
      await loadCourseRequests();
    } else {
      // 如果验证失败，恢复按钮状态并显示错误
      if (requestElement) {
        const buttons = requestElement.querySelectorAll(".request-btn");
        buttons.forEach((btn) => (btn.disabled = false));
      }
      throw new Error("Failed to verify request status update");
    }
  } catch (error) {
    console.error("Error handling request action:", error);
    showNotification(
      "Une erreur est survenue lors du traitement de la demande. Veuillez réessayer.",
      "error"
    );

    // 恢复按钮状态
    const requestElement = document.querySelector(
      `[data-request-id="${requestId}"]`
    );
    if (requestElement) {
      const buttons = requestElement.querySelectorAll(".request-btn");
      buttons.forEach((btn) => (btn.disabled = false));
    }
  }
}

// 显示通知
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 初始化
export async function initialize() {
  try {
    // 加载即将到来的课程
    await updateUpcomingCourses();

    // 加载课程申请
    await loadCourseRequests();

    // 设置定时更新
    setInterval(updateUpcomingCourses, 5 * 60 * 1000);
    setInterval(loadCourseRequests, 5 * 60 * 1000);

    // 设置全局函数
    window.handleRequestAction = handleRequestAction;

    // 确保全局函数设置成功
    console.log(
      "Global handleRequestAction function set:",
      !!window.handleRequestAction
    );
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}
