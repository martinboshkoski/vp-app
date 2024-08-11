document.addEventListener("DOMContentLoaded", function () {
    const dropdowns = document.querySelectorAll('.dropdown');
  
    dropdowns.forEach(dropdown => {
      dropdown.addEventListener('click', function (event) {
        event.stopPropagation();
        const content = this.querySelector('.dropdown-content');
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });
  
    document.addEventListener('click', function () {
      dropdowns.forEach(dropdown => {
        const content = dropdown.querySelector('.dropdown-content');
        content.style.display = 'none';
      });
    });
  });
  