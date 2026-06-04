class StudySession {
  constructor(id, subject, topic, day, start, end, status = "planned") {
    this.id = id;
    this.subject = subject;
    this.topic = topic;
    this.day = day;
    this.start = start;
    this.end = end;
    this.status = status;
  }

  markCompleted() {
    this.status = "completed";
  }
  
  fetchStudySessionData(){
    //Can put your fetch logic here
    //This can return the data that you want, this is reusable
  }
}

const studySessionInstance = new StudySession();
export default studySessionInstance;