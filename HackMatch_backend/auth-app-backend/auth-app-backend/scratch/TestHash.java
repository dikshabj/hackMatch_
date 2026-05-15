import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$TMBzlW4EV5VwfUh9F9pC9umpR3FHlMYBJzyMnDCB26x/7nUaArEv.";
        String password = "diksha@123";
        System.out.println("Match: " + encoder.matches(password, hash));
    }
}
