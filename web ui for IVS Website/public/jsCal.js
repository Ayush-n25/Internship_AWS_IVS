document.addEventListener('DOMContentLoaded', function() {
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var monthYear = document.getElementById('monthYear');
    var calendarBody = document.getElementById('calendarBody');
  
    var date = new Date();
  
    function renderCalendar() {
      var currentMonth = date.getMonth();
      var currentYear = date.getFullYear();
  
      var firstDay = new Date(currentYear, currentMonth, 1);
      var lastDay = new Date(currentYear, currentMonth + 1, 0);
      var startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
      var endDate = new Date(lastDay);
      endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
      document.getElementById('monthDisp').innerText =
        getMonthName(currentMonth) + ' ' + currentYear;
      var calendarRows = '';
  
      while (startDate <= endDate) {
        calendarRows += '<tr>';
  
        for (var i = 0; i < 7; i++) {
          var currentDate = startDate.getDate();
          var cellClass = startDate.getMonth() !== currentMonth ? 'inactive' : '';
  
          calendarRows +=
            '<td class="' +
            cellClass +
            '">' +
            currentDate +
            '</td>';
  
          startDate.setDate(startDate.getDate() + 1);
        }
  
        calendarRows += '</tr>';
      }
  
      calendarBody.innerHTML = calendarRows;
  
      // Add event listener to all cells
      var cells = calendarBody.getElementsByTagName('td');
      for (var j = 0; j < cells.length; j++) {
        cells[j].addEventListener('click', bookStream);
      }
    }
  
    function getMonthName(monthIndex) {
      var monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ];
  
      return monthNames[monthIndex];
    }
  
    prevBtn.addEventListener('click', function() {
      date.setMonth(date.getMonth() - 1);
      renderCalendar();
    });
  
    nextBtn.addEventListener('click', function() {
      date.setMonth(date.getMonth() + 1);
      renderCalendar();
    });
  
    renderCalendar();
  });
  
  function bookStream(event) {
    var cells = calendarBody.getElementsByTagName('td');
  for (var j = 0; j < cells.length; j++) {
    cells[j].style.backgroundColor = ''; // Reset background color of all cells
  }
    var cellContent = event.target.innerText;
    event.target.style.backgroundColor = 'lightblue';
    //return cellContent;
    document.getElementById('StreamDate').style.fontWeight='bold';
    document.getElementById('StreamDate').style.paddingTop="inherit";
    document.getElementById('StreamDate').style.textAlign='center';
    document.getElementById('StreamDate').style.verticalAlign='center';
    var mnth=document.getElementById('monthDisp').innerText;
    document.getElementById('StreamDate').innerHTML=cellContent+" "+mnth;
  }
  
  // for total time calc
  function TTime() {
    let time1 = document.getElementById('st').value;
    let time2 = document.getElementById('et').value;
    //
    if (time1 != '' && time2 != '') {
      const [hours1, minutes1] = time1.split(':').map(Number);
      const [hours2, minutes2] = time2.split(':').map(Number);
  
      let diffHours = hours2 - hours1;
      let diffMinutes = minutes2 - minutes1;
  
      if (diffMinutes < 0) {
        diffHours--;
        diffMinutes += 60;
      }
      let ans = diffHours + 'h : ' + diffMinutes+'m';
      document.getElementById('totalHours').style.fontSize="small";
      document.getElementById('totalHours').style.fontWeight="bold";
      document.getElementById('totalHours').innerText = ans;
    }
  }
  