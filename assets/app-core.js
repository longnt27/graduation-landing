const CONFIG = {
    eventDate: '2026-09-27T00:00:00+07:00',
    eventDay: 'Chủ Nhật',
    time: 'Thời gian sẽ cập nhật',
    location: 'Địa điểm sẽ được cập nhật',
    mapUrl: 'https://maps.app.goo.gl/3xVTwm98D731VokG9',
    timeline: [
      { time:'01', title:'Đón khách', desc:'Gặp nhau và chụp ảnh trước buổi lễ.' },
      { time:'02', title:'Lễ tốt nghiệp', desc:'Cùng em Long tham dự khoảnh khắc chính thức của ngày tốt nghiệp.' },
      { time:'03', title:'Chụp ảnh & gặp gỡ', desc:'Chụp ảnh cùng gia đình, bạn bè và thầy cô sau buổi lễ.' }
    ]
  };
  const $ = s => document.querySelector(s);
  const escapeHtml = (s='') => String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#39;");
  const formatDateTime = iso => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN',{dateStyle:'short',timeStyle:'short'}).format(d);
  };
  const attendanceLabel = v => ({
    attending:'Sẽ tham dự',
    maybe:'Có thể tham dự',
    declined:'Rất tiếc, không tham dự được'
  }[v] || v);
  const toast = $('#toast');
  function showToast(message){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.classList.remove('show'),2300);
  }
  function setStatus(el,message,type='success'){
    el.className = `status show ${type}`;
    el.innerHTML = message;
  }
  async function prepareGuestbookImage(file){
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) {
      throw new Error('Ảnh phải là JPEG, PNG hoặc WebP.');
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new Error('Ảnh gốc quá lớn. Vui lòng chọn ảnh dưới 15 MB.');
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve,reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Không thể đọc ảnh đã chọn.'));
        img.src = objectUrl;
      });

      const maxSide = 1400;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Trình duyệt không thể xử lý ảnh này.');
      ctx.drawImage(image, 0, 0, width, height);

      let dataUrl = canvas.toDataURL('image/webp', .82);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', .82);
      }
      if (dataUrl.length > 2_800_000) {
        dataUrl = canvas.toDataURL('image/webp', .68);
      }
      if (dataUrl.length > 2_800_000) {
        throw new Error('Ảnh sau khi tối ưu vẫn quá lớn. Vui lòng chọn ảnh nhỏ hơn.');
      }
      return dataUrl;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  $('#heroMeta').textContent = `${CONFIG.eventDay} · ${CONFIG.time} · ${CONFIG.location}`;
  $('#detailTime').textContent = CONFIG.time;
  $('#detailLocation').textContent = CONFIG.location;
  if(CONFIG.mapUrl){
    $('#mapBtn').href = CONFIG.mapUrl;
    $('#mapBtn').hidden = false;
  }
  const timeline = $('#timeline');
  if (timeline) {
    timeline.innerHTML = CONFIG.timeline.map(x => `
      <div class="timeline-item">
        <div class="timeline-time">${escapeHtml(x.time)}</div>
        <div class="timeline-copy"><strong>${escapeHtml(x.title)}</strong><span>${escapeHtml(x.desc)}</span></div>
      </div>
    `).join('');
  }
  function tick(){
    const diff = new Date(CONFIG.eventDate).getTime() - Date.now();
    const safe = Math.max(0,diff);
    const values = [
      Math.floor(safe / 86400000),
      Math.floor((safe % 86400000) / 3600000),
      Math.floor((safe % 3600000) / 60000),
      Math.floor((safe % 60000) / 1000)
    ];
    ['days','hours','minutes','seconds'].forEach((id,i)=>{
      document.getElementById(id).textContent = String(values[i]).padStart(2,'0');
    });
  }
  tick();
  setInterval(tick,1000);
  $('#shareBtn').addEventListener('click', async ()=>{
    const data = {
      title: document.title,
      text: 'Mời bạn tới dự lễ tốt nghiệp của em Long ngày 27/09/2026.',
      url: location.href
    };
    try{
      if(navigator.share) await navigator.share(data);
      else{
        await navigator.clipboard.writeText(location.href);
        showToast('Đã copy link thiệp mời');
      }
    }catch(err){
      if(err.name !== 'AbortError') showToast('Không thể chia sẻ link');
    }
  });
  const attendance = $('#attendance');
  const arrivalTime = $('#arrivalTime');
  const companions = $('#companions');
  function syncAttendanceFields(){
    const declined = attendance.value === 'declined';
    arrivalTime.disabled = declined;
    arrivalTime.required = false;
    companions.disabled = declined;
    if(declined){
      arrivalTime.value = '';
      companions.value = '0';
    }
  }
  attendance.addEventListener('change',syncAttendanceFields);
  $('#rsvpForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const form = e.currentTarget;
    const status = $('#rsvpStatus');
    if(!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.companions = Number(payload.companions || 0);
    const btn = $('#rsvpSubmit');
    btn.disabled = true;
    btn.textContent = 'Đang gửi…';
    try{
      const res = await fetch('/api/rsvp',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Không thể gửi xác nhận');
      const r = data.rsvp;
      setStatus(status,
        `<strong>Đã ghi nhận phản hồi của ${escapeHtml(r.guest_name)}.</strong><br>` +
        `Trạng thái: <strong>${escapeHtml(attendanceLabel(r.attendance))}</strong><br>` +
        (r.arrival_time ? `Dự kiến có mặt: <strong>${escapeHtml(r.arrival_time)}</strong><br>` : '') +
        `Xác nhận lúc: <strong>${escapeHtml(formatDateTime(r.created_at))}</strong>`
      );
      form.reset();
      syncAttendanceFields();
      showToast('Đã gửi xác nhận tham dự');
    }catch(err){
      setStatus(status,escapeHtml(err.message || 'Có lỗi xảy ra'),'error');
    }finally{
      btn.disabled = false;
      btn.textContent = 'Gửi xác nhận';
    }
  });
  async function loadGuestbook(){
    const root = $('#guestbookFeed');
    try{
      const res = await fetch('/api/guestbook');
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Không thể tải lưu bút');
      if(!data.messages?.length){
        root.innerHTML = '<div class="empty">Chưa có lời lưu bút nào. Bạn có thể là người viết đầu tiên.</div>';
        return;
      }
      root.innerHTML = data.messages.map(m => `
        <div class="message">
          <div class="message-head">
            <div>
              <div class="message-name">${escapeHtml(m.name || 'Ẩn danh')}</div>
              ${m.title ? `<div class="message-title">${escapeHtml(m.title)}</div>` : ''}
            </div>
            <div class="message-time">${escapeHtml(formatDateTime(m.created_at))}</div>
          </div>
          <div class="message-body">${escapeHtml(m.message)}</div>
          ${m.image_url ? `<img class="message-photo" src="${escapeHtml(m.image_url)}" alt="Ảnh đính kèm trong lưu bút" loading="lazy">` : ''}
        </div>
      `).join('');
    }catch(err){
      root.innerHTML = `<div class="empty">${escapeHtml(err.message || 'Không thể tải lưu bút')}</div>`;
    }
  }
  $('#guestbookForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const form = e.currentTarget;
    const status = $('#guestbookStatus');
    if(!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload = {
      website: formData.get('website') || '',
      name: formData.get('name') || '',
      title: formData.get('title') || '',
      message: formData.get('message') || ''
    };
    const imageFile = formData.get('image');
    const btn = $('#guestbookSubmit');
    btn.disabled = true;

    try{
      if(imageFile instanceof File && imageFile.size > 0){
        btn.textContent = 'Đang xử lý ảnh…';
        payload.image = await prepareGuestbookImage(imageFile);
      }
      btn.textContent = 'Đang gửi…';
      const res = await fetch('/api/guestbook',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Không thể gửi lời chúc');
      setStatus(status,
        `<strong>Đã lưu lời chúc của ${escapeHtml(data.message.name || 'Ẩn danh')}.</strong><br>` +
        `Gửi lúc: <strong>${escapeHtml(formatDateTime(data.message.created_at))}</strong>`
      );
      form.reset();
      await loadGuestbook();
      showToast('Đã gửi lời chúc');
    }catch(err){
      setStatus(status,escapeHtml(err.message || 'Có lỗi xảy ra'),'error');
    }finally{
      btn.disabled = false;
      btn.textContent = 'Gửi lời chúc';
    }
  });
  const mobileBar = document.querySelector('.mobile-bar');
  if (mobileBar && 'IntersectionObserver' in window) {
    const visibleSections = new Set();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleSections.add(entry.target.id);
        else visibleSections.delete(entry.target.id);
      }
      mobileBar.classList.toggle('hidden', visibleSections.size > 0);
    }, { threshold: 0.08 });
    observer.observe(document.getElementById('rsvp'));
    observer.observe(document.getElementById('guestbook'));
  }
  loadGuestbook();