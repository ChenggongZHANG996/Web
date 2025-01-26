import { baseUrl } from "../Configuration_Js/base-url.js";
import { supabaseClient } from "../Configuration_Js/supabase-config.js";

// 测试用户数据 - 使用时间戳确保邮箱唯一
function generateTestUser() {
  return {
    email: `test.${Date.now()}@example.com`,
    password: "test123456",
    first_name: "Test",
    last_name: "User",
    user_type: "student",
    phone: "0612345678",
  };
}

// 测试数据库连接
async function testConnection() {
  console.log("Testing database connection...");
  try {
    const { data, error } = await supabaseClient
      .from("users")
      .select("count")
      .limit(1);

    if (error) throw error;
    console.log("✓ Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    return false;
  }
}

// 测试创建用户
async function testCreateUser() {
  console.log("Testing user creation...");
  try {
    // 生成新的测试用户数据
    const testUser = generateTestUser();

    // 创建 Auth 用户 - 使用客户端 API
    console.log("Creating user in Auth system...");
    const { data: authData, error: authError } =
      await supabaseClient.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            user_type: testUser.user_type,
          },
        },
      });

    if (authError) {
      console.error(
        "❌ Failed to create user in Auth system:",
        authError.message
      );
      throw authError;
    }

    if (!authData.user) {
      throw new Error("❌ Auth user creation failed: No user data returned");
    }

    console.log("✓ Successfully created user in Auth system");
    console.log("  - Auth ID:", authData.user.id);
    console.log("  - Email:", testUser.email);

    // 只有在认证系统创建成功后，才创建数据库用户
    console.log("Creating user in database...");
    const { error: dbError } = await supabaseClient.from("users").insert([
      {
        id: authData.user.id,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        user_type: testUser.user_type,
        phone: testUser.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: false,
        status: "pending",
      },
    ]);

    if (dbError) {
      console.error(
        "Warning: Failed to create user in database:",
        dbError.message
      );
      console.log("Note: User was still created in Auth system successfully");
    } else {
      console.log("✓ Additionally created user in database");
    }

    return true;
  } catch (error) {
    console.error("User creation failed:", error.message);
    return false;
  }
}

// 测试读取用户
async function testReadUsers() {
  console.log("Testing user retrieval...");
  try {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .limit(5);

    if (error) throw error;
    console.log("✓ Retrieved users:", data);
    return true;
  } catch (error) {
    console.error("User retrieval failed:", error.message);
    return false;
  }
}

// 测试认证系统
async function testAuthSystem() {
  console.log("=== Testing Auth System ===");
  try {
    // 1. 测试会话获取
    console.log("Testing session retrieval...");
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    console.log(
      "✓ Session data:",
      session ? "Active session found" : "No active session"
    );

    // 2. 测试认证状态
    console.log("Testing auth state...");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError) {
      console.log("Note: No authenticated user found");
    } else {
      console.log(
        "✓ Auth state:",
        user ? `Authenticated as ${user.email}` : "Not authenticated"
      );
    }

    // 3. 尝试读取认证用户列表
    console.log("Testing auth users retrieval...");
    try {
      const {
        data: { users },
        error: listError,
      } = await supabaseClient.auth.admin.listUsers();
      if (listError) {
        console.log("Note: Could not read Auth users list:", listError.message);
      } else {
        console.log("✓ Auth users found:", users.length, "users");
        users.forEach((user, index) => {
          console.log(`User ${index + 1}:`, {
            id: user.id,
            email: user.email,
            emailConfirmed: user.email_confirmed_at,
            createdAt: user.created_at,
            metadata: user.user_metadata,
          });
        });
      }
    } catch (listError) {
      console.log("Note: Admin API not accessible:", listError.message);
    }

    // 4. 尝试从数据库读取用户信息
    console.log("Testing database users retrieval...");
    const { data: dbUsers, error: dbError } = await supabaseClient
      .from("users")
      .select("*")
      .limit(5);

    if (dbError) {
      console.log("Note: Could not read database users:", dbError.message);
    } else {
      console.log("✓ Database users found:", dbUsers.length, "users");
      dbUsers.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id,
          email: user.email,
          userType: user.user_type,
          status: user.status,
          emailVerified: user.email_verified,
        });
      });
    }

    return true;
  } catch (error) {
    console.log("Auth system status:", error.message);
    return true;
  }
}

// 检查系统状态的函数
async function checkSystemStatus(updateStatus, statuses) {
  try {
    // 更新所有状态为"检查中"
    statuses.forEach((status) => {
      updateStatus(status.id, `${status.text}: Checking...`);
    });

    // 测试会话和认证状态
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    // 更新会话状态 - 如果有session或user都认为是有效的
    const hasValidSession = !sessionError && (!!session || !!user);
    updateStatus(
      "sessionStatus",
      `Session: ${hasValidSession ? "Active" : "None"}`,
      hasValidSession
    );

    // 更新认证状态 - 检查是否有用户数据
    const isAuthenticated = !userError && !!user;
    updateStatus(
      "authStatus",
      `Auth: ${isAuthenticated ? "Authenticated" : "Not authenticated"}`,
      isAuthenticated
    );

    // 测试数据库连接
    const { data: dbTest, error: dbError } = await supabaseClient
      .from("users")
      .select("count")
      .single();

    const isDbConnected = !dbError && dbTest !== null;
    updateStatus(
      "dbStatus",
      `Database: ${isDbConnected ? "Connected" : "Error"}`,
      isDbConnected
    );

    // 测试认证数据读取 - 添加错误处理
    try {
      const { data: dbUsers, error: authDataError } = await supabaseClient
        .from("users")
        .select("*")
        .limit(5);

      const hasUsers = !authDataError && dbUsers && dbUsers.length > 0;
      updateStatus(
        "authDataStatus",
        `Auth Data: ${hasUsers ? `${dbUsers.length} users` : "No users"}`,
        hasUsers
      );

      // 如果成功读取到用户数据，在控制台输出详细信息
      if (hasUsers) {
        console.log(
          "Found users:",
          dbUsers.map((u) => ({
            id: u.id,
            email: u.email,
            user_type: u.user_type,
            status: u.status,
          }))
        );
      }
    } catch (dataError) {
      console.error("Failed to read auth data:", dataError);
      updateStatus("authDataStatus", "Auth Data: Error", false);
    }
  } catch (error) {
    console.error("Status check failed:", error);
    // 更新所有状态为错误
    statuses.forEach((status) => {
      updateStatus(status.id, `${status.text}: Error`, false);
    });
  }
}

// 添加测试按钮到页面
function addTestButton() {
  // 创建状态显示容器
  const statusContainer = document.createElement("div");
  statusContainer.id = "system-status";
  statusContainer.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 5px;
        min-width: 200px;
    `;

  // 创建状态显示
  const statuses = [
    { id: "sessionStatus", text: "Session" },
    { id: "authStatus", text: "Auth" },
    { id: "dbStatus", text: "Database" },
    { id: "authDataStatus", text: "Auth Data" },
  ];

  statuses.forEach((status) => {
    const statusElement = document.createElement("div");
    statusElement.id = status.id;
    statusElement.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 2px 0;
        `;

    const indicator = document.createElement("span");
    indicator.className = "status-indicator";
    indicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #666;
            display: inline-block;
            flex-shrink: 0;
        `;

    const text = document.createElement("span");
    text.className = "status-text";
    text.style.cssText = `
            flex-grow: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
    text.textContent = `${status.text}: Waiting...`;

    statusElement.appendChild(indicator);
    statusElement.appendChild(text);
    statusContainer.appendChild(statusElement);
  });

  // 更新状态显示的函数
  function updateStatus(id, message, success = null) {
    const element = document.getElementById(id);
    if (element) {
      const indicator = element.querySelector(".status-indicator");
      const text = element.querySelector(".status-text");

      if (success !== null) {
        indicator.style.background = success ? "#4CAF50" : "#f44336";
      } else {
        indicator.style.background = "#FFA000"; // 黄色表示检查中
      }

      text.textContent = message;
    }
  }

  // 只在不存在时添加状态容器
  if (!document.getElementById("system-status")) {
    document.body.appendChild(statusContainer);
    // 立即执行一次状态检查
    checkSystemStatus(updateStatus, statuses);

    // 每30秒自动更新一次状态
    setInterval(() => {
      checkSystemStatus(updateStatus, statuses);
    }, 30000);
  }

  // 创建测试按钮
  const button = document.createElement("button");
  button.textContent = "Run DB Tests";
  button.style.cssText = `
        position: fixed;
        bottom: 50px;
        right: 10px;
        padding: 10px 20px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
        opacity: 0;
    `;

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#1976D2";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#2196F3";
    button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.style.opacity = "0.7";

    try {
      // 首先运行所有测试（包括创建用户）
      console.log("=== Running All Tests ===");

      // 创建新用户
      console.log("\n--- Creating Test User ---");
      const createSuccess = await testCreateUser();
      if (!createSuccess) {
        console.error("❌ User creation failed");
      } else {
        console.log("✓ User creation successful");
      }

      // 然后更新状态显示
      await checkSystemStatus(updateStatus, statuses);
    } catch (error) {
      console.error("Test execution failed:", error);
    } finally {
      button.disabled = false;
      button.style.opacity = "1";
    }
  });

  document.body.appendChild(button);
}

// 当页面加载完成时添加测试按钮和执行初始检查
document.addEventListener("DOMContentLoaded", addTestButton);

// 运行所有测试
async function runAllTests() {
  console.log("=== Starting All Tests ===");

  // 1. 测试认证系统
  console.log("\n--- Testing Auth System ---");
  const authSuccess = await testAuthSystem();
  if (!authSuccess) {
    console.error("Auth system test failed");
    return;
  }

  // 2. 测试数据库连接
  console.log("\n--- Testing Database Connection ---");
  const connectionSuccess = await testConnection();
  if (!connectionSuccess) {
    console.error("Database connection test failed");
    return;
  }

  // 3. 测试用户创建
  console.log("\n--- Testing User Creation ---");
  const createSuccess = await testCreateUser();
  if (!createSuccess) {
    console.error("User creation test failed");
    return;
  }

  // 4. 测试用户读取
  console.log("\n--- Testing User Retrieval ---");
  const readSuccess = await testReadUsers();
  if (!readSuccess) {
    console.error("User retrieval test failed");
    return;
  }

  console.log("\n=== All Tests Completed Successfully ===");
}

// 导出测试函数供其他模块使用
export { testConnection, testCreateUser, testReadUsers, runAllTests };
