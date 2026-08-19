package ca.renewalready.api.calculation;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/mortgage-comparisons")
public class MortgageCalculationController {

    private final MortgageCalculationService calculationService;

    public MortgageCalculationController(MortgageCalculationService calculationService) {
        this.calculationService = calculationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public MortgageComparisonResponse compare(@Valid @RequestBody MortgageComparisonRequest request) {
        return calculationService.compare(request);
    }
}
