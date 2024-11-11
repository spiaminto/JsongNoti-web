package com.jsongnoti.jsongnoti_web.controller;

import com.jsongnoti.jsongnoti_web.domain.User;
import com.jsongnoti.jsongnoti_web.mail.GmailSender;
import com.jsongnoti.jsongnoti_web.repository.UserRepository;
import com.jsongnoti.jsongnoti_web.service.ResultDto;
import com.jsongnoti.jsongnoti_web.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.UUID;

@Controller
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<String> addUser(@Validated @ModelAttribute SubscriptionDto subscriptionDto,
                                          BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            log.info("bindingResult: {}", bindingResult);
            log.info("bindingResult.getFieldError(): {}", bindingResult.getFieldError());
            log.info("bindingResult.getFieldError().getDefaultMessage(): {}", bindingResult.getFieldError().getDefaultMessage());
            log.info("bindingResult.getFieldError().code: {}", bindingResult.getFieldError().getCode());
            return ResponseEntity.badRequest().body(bindingResult.getFieldError().getDefaultMessage());
        }

        log.info("email: {}", subscriptionDto.getEmail());
        String email = subscriptionDto.getEmail();

        ResultDto resultDto = userService.addUser(email);

        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(resultDto.getMessage()) :
                ResponseEntity.ok().body(resultDto.getMessage());
    }

    @GetMapping("/users/{userId}/verify")
    public String verifyAddUser(@PathVariable(name = "userId") Long userId,
                                                  @RequestParam(name = "token") String authenticationToken,
                                                  RedirectAttributes redirectAttributes) {
        log.info("userId: {}, token: {}", userId, authenticationToken);

        ResultDto resultDto = userService.verifyAddUser(userId, authenticationToken);
        redirectAttributes.addFlashAttribute("alertMessage", resultDto.getMessage());

        return "redirect:/";
    }

    @PostMapping("/users/delete")
    public ResponseEntity<String> deleteUser(@Validated @ModelAttribute UnSubscriptionDto unSubscriptionDto,
                                             BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(bindingResult.getFieldError().getDefaultMessage());
        }

        String email = unSubscriptionDto.getEmail();
        log.info("email: {}", email);

        ResultDto resultDto = userService.deleteUser(email);
        return resultDto.isHasError() ? // 검증오류시 409 conflict
                ResponseEntity.status(409).body(resultDto.getMessage()) :
                ResponseEntity.ok().body(resultDto.getMessage());
    }

    @GetMapping("/users/{userId}/delete")
    public String confirmDelete(@PathVariable(name = "userId") Long userId,
                                  @RequestParam(name = "token") String authenticationToken,
                                  RedirectAttributes redirectAttributes) {
        log.info("userId: {}, token: {}", userId, authenticationToken);

        ResultDto resultDto = userService.verifyDeleteUser(userId, authenticationToken);
        redirectAttributes.addFlashAttribute("alertMessage", resultDto.getMessage());

        return "redirect:/";
    }

}
