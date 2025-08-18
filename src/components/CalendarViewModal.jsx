import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import dayjs from "dayjs";
import { getTasks } from "../util/apiUtil";
import "./CalendarViewModal.css";

const CalendarViewModal = ({ closeModal, userId, plantingObjId }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (userId && plantingObjId) {
      fetchEvents();
    }
  }, [userId, plantingObjId]);
  

  const fetchEvents = () => {
    getTasks(userId, plantingObjId)
      .then((data) => {
        console.log("API Response (Tasks):", data);
        if (Array.isArray(data) && data.length > 0) {
          const formattedEvents = data.map((task) => {
            const quantityStr = task.quantity?.value
            ? `${parseFloat(task.quantity.value).toFixed(2)} ${task.quantity.unit ?? ""}`
            : task.quantity ?? "";
          
            const isTimeIncluded = dayjs(task.DOE).format("HH:mm:ss") !== "00:00:00";

            return {
              id: task.id,
    title: `${task.applied_item ?? "Task"} - ${quantityStr}`,
    start: task.DOE,                  // full ISO string
    allDay: !isTimeIncluded,          // dynamic: allDay = false if time is present
    display: "block",
            };
          });
          setEvents(formattedEvents);
        }
      })
      .catch((error) => {
        console.error("Error fetching tasks for calendar:", error);
      });
  };

  return (
    <Dialog
      open={true}
      onClose={closeModal}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: "#f7f7f7",
          borderRadius: "20px",
          padding: "1rem",
          width: "60%",
          height: "80%",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          color: "#a60f2d",
          fontSize: "1.25rem",
          fontWeight: "600",
        }}
      >
        Calendar View
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: "#fff" }}>
        <div className="customCalendarStyles">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FullCalendar
  key={events.length} // Forces re-render on data change
  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={events}
  headerToolbar={{
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
  }}
  eventDisplay="block"
  height="auto"
  dayMaxEvents={true}
  dayMaxEventRows={5}
  eventContent={(info) => {
    return {
      html: `<div title="${info.event.title}">${info.event.title}</div>`,
    };
  }}
/>

          </LocalizationProvider>
        </div>
      </DialogContent>

      <DialogActions sx={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
        <Button
          onClick={closeModal}
          variant="contained"
          sx={{
            top: "0.8rem",
            backgroundColor: "#6c757d",
            color: "white",
            width: "15%",
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarViewModal;