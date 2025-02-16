const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const modalForm = document.getElementById("modalForm");
const commandInput = document.getElementById("command");
const responseInput = document.getElementById("response");
const cancelButton = document.getElementById("cancelButton");

// Function to open the modal with a specific title and command data
const openModal = (title, cmd = null) => {
  modalTitle.textContent = title;
  commandInput.value = cmd ? cmd.command : "";
  responseInput.value = cmd ? cmd.response : "";
  modal.classList.add("flex");
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    modalContent.classList.remove("scale-95");
    modalContent.classList.add("scale-100");
  }, 10);
};

// Add Command Button
document.getElementById("addCommandButton").addEventListener("click", () => {
  openModal("Add New Command");
});

// Edit Command Buttons
document.querySelectorAll(".editCommandButton").forEach((button) => {
  button.addEventListener("click", (event) => {
    const cmd = JSON.parse(event.target.getAttribute("data-cmd"));

    document.querySelector("#command_id").value = cmd.id;
    document.querySelector("#form_action").value = "edit";

    openModal("Edit Command", cmd);

    commandInput.parentElement.classList.remove("hidden");
    responseInput.parentElement.classList.remove("hidden");
  });
});

// Delete Command Buttons
document.querySelectorAll(".deleteCommandButton").forEach((button) => {
  button.addEventListener("click", (event) => {
    const cmd = JSON.parse(event.target.getAttribute("data-cmd"));

    document.querySelector("#command_id").value = cmd.id;
    document.querySelector("#form_action").value = "delete";

    openModal(`Did you want to delete "${cmd.command}" command?`, cmd);

    commandInput.parentElement.classList.add("hidden");
    responseInput.parentElement.classList.add("hidden");
  });
});

// Cancel Button
cancelButton.addEventListener("click", () => {
  modal.classList.add("opacity-0");
  modalContent.classList.remove("scale-100");
  modalContent.classList.add("scale-95");

  setTimeout(function () {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }, 300);
});

// Create function to load the new created command after submit
async function loadNewCommand() {
  try {
    // Fetch the updated list of commands from the server
    const response = await fetch(`${SAFE_API_URL}/api/command`);
    const commands = await response.json();

    // Get the table body element
    const tableBody = document.querySelector("tbody");

    // Clear the existing table rows
    tableBody.innerHTML = "";

    const commandData = commands.data || commands;

    // Append the new rows with the updated list of commands
    commandData.commands.forEach((cmd) => {
      const row = document.createElement("tr");
      row.classList.add(
        "hover:bg-gray-50",
        "dark:hover:bg-gray-700",
        "transition-colors"
      );

      const commandCell = document.createElement("td");
      commandCell.classList.add(
        "px-4",
        "py-2",
        "text-sm",
        "text-gray-900",
        "dark:text-gray-200"
      );
      commandCell.textContent = cmd.command;

      const responseCell = document.createElement("td");
      responseCell.classList.add(
        "px-4",
        "py-2",
        "text-sm",
        "text-gray-900",
        "dark:text-gray-200"
      );
      responseCell.textContent = cmd.response;

      const actionsCell = document.createElement("td");
      actionsCell.classList.add("px-4", "py-2", "text-sm", "flex", "space-x-2");

      const editButton = document.createElement("button");
      editButton.classList.add(
        "editCommandButton",
        "px-2",
        "py-1",
        "rounded",
        "text-white",
        "bg-blue-600",
        "hover:bg-blue-900",
        "dark:bg-blue-500",
        "dark:hover:bg-blue-700"
      );
      editButton.textContent = "Edit";
      editButton.setAttribute("data-cmd", JSON.stringify(cmd));

      const deleteButton = document.createElement("button");
      deleteButton.classList.add(
        "deleteCommandButton",
        "px-2",
        "py-1",
        "rounded",
        "text-white",
        "bg-red-600",
        "hover:bg-red-900",
        "dark:bg-red-500",
        "dark:hover:bg-red-700"
      );
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("data-cmd", JSON.stringify(cmd));

      actionsCell.appendChild(editButton);
      actionsCell.appendChild(deleteButton);

      row.appendChild(commandCell);
      row.appendChild(responseCell);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });

    // Re-attach event listeners to the new edit and delete buttons
    document.querySelectorAll(".editCommandButton").forEach((button) => {
      button.addEventListener("click", (event) => {
        const cmd = JSON.parse(event.target.getAttribute("data-cmd"));

        document.querySelector("#command_id").value = cmd.id;
        document.querySelector("#form_action").value = "edit";

        openModal("Edit Command", cmd);

        commandInput.parentElement.classList.remove("hidden");
        responseInput.parentElement.classList.remove("hidden");
      });
    });

    document.querySelectorAll(".deleteCommandButton").forEach((button) => {
      button.addEventListener("click", (event) => {
        const cmd = JSON.parse(event.target.getAttribute("data-cmd"));

        document.querySelector("#command_id").value = cmd.id;
        document.querySelector("#form_action").value = "delete";

        openModal(`Did you want to delete "${cmd.command}" command?`, cmd);

        commandInput.parentElement.classList.add("hidden");
        responseInput.parentElement.classList.add("hidden");
      });
    });
  } catch (error) {
    console.error("Error loading new command:", error);
    createToast("warning", "Failed!", "Error loading new command.");
  }
}

// Form Submission
modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  if (data.action === "add") {
    const response = await fetch(`${SAFE_API_URL}/api/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: data.command,
        response: data.response,
      }),
    });

    const result = await response.json();

    if (result.status) {
      createToast("info", "Success!", result.message);
      setTimeout(() => {
        loadNewCommand();
      }, 3000);
    } else {
      createToast("warning", "Failed!", result.message);
    }
  } else if (data.action === "edit") {
    const response = await fetch(
      `${SAFE_API_URL}/api/command/${data.command_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: data.command,
          response: data.response,
        }),
      }
    );

    const result = await response.json();

    if (result.status) {
      createToast("info", "Success!", result.message);
      setTimeout(() => {
        loadNewCommand();
      }, 3000);
    } else {
      createToast("warning", "Failed!", result.message);
    }
  } else if (data.action === "delete") {
    const response = await fetch(
      `${SAFE_API_URL}/api/command/${data.command_id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (result.status) {
      createToast("info", "Success!", result.message);
      setTimeout(() => {
        loadNewCommand();
      }, 3000);
    } else {
      createToast("warning", "Failed!", result.message);
    }
  }

  modal.classList.add("opacity-0");
  modalContent.classList.remove("scale-100");
  modalContent.classList.add("scale-95");

  setTimeout(function () {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }, 300);
});
