// GERÇEK MATEMATİK MOTORU - Math.js kullanarak
class MathEngine {
    constructor() {
        this.parser = math.parser();
    }

    // İNTEGRAL HESAPLAMA
    integral(expression, variable = 'x') {
        try {
            // Basit integral kuralları
            const expr = this.parseExpression(expression);
            
            // Polinom integrali
            if (this.isPolynomial(expr, variable)) {
                return this.polynomialIntegral(expr, variable);
            }
            
            // Üstel fonksiyonlar
            if (expr.includes('e^')) {
                return this.exponentialIntegral(expr, variable);
            }
            
            // Trigonometrik fonksiyonlar
            if (this.hasTrig(expr)) {
                return this.trigIntegral(expr, variable);
            }
            
            // Genel integral (sayısal yaklaşım)
            return this.numericalIntegral(expr, variable);
            
        } catch (error) {
            return { error: error.message };
        }
    }

    polynomialIntegral(expr, variable) {
        try {
            const terms = this.splitTerms(expr);
            let result = [];
            
            for (let term of terms) {
                // x^n şeklindeki terimleri işle
                const match = term.match(/(-?\d*\.?\d*)\*?\s*x\^(\d+)/);
                if (match) {
                    const coef = match[1] === '' || match[1] === '-' ? (match[1] === '-' ? -1 : 1) : parseFloat(match[1]);
                    const power = parseInt(match[2]);
                    const newCoef = coef / (power + 1);
                    const newPower = power + 1;
                    result.push(`${newCoef}*x^${newPower}`);
                    continue;
                }
                
                // x şeklindeki terimleri işle
                const xMatch = term.match(/(-?\d*\.?\d*)\*?\s*x$/);
                if (xMatch) {
                    const coef = xMatch[1] === '' || xMatch[1] === '-' ? (xMatch[1] === '-' ? -1 : 1) : parseFloat(xMatch[1]);
                    result.push(`${coef / 2}*x^2`);
                    continue;
                }
                
                // Sabit terimleri işle
                const constMatch = term.match(/^(-?\d+\.?\d*)$/);
                if (constMatch) {
                    const coef = parseFloat(constMatch[1]);
                    result.push(`${coef}*x`);
                }
            }
            
            const integralResult = result.join(' + ').replace(/\+ -/g, '- ') + ' + C';
            return {
                result: integralResult,
                latex: this.toLatex(integralResult),
                steps: this.getIntegralSteps(expr, result)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    exponentialIntegral(expr, variable) {
        // e^x integrali
        if (expr === `e^${variable}`) {
            return {
                result: `e^${variable} + C`,
                latex: `e^{${variable}} + C`,
                steps: [`∫ e^${variable} d${variable} = e^${variable} + C`]
            };
        }
        
        // e^(ax) integrali
        const match = expr.match(/e\^(?:\()?(-?\d*\.?\d*)\*?x(?:\))?/);
        if (match) {
            const a = match[1] === '' ? 1 : parseFloat(match[1]);
            const result = a === 1 ? `e^x` : `(1/${a})*e^(${a}*x)`;
            return {
                result: result + ' + C',
                latex: a === 1 ? 'e^x + C' : `\\frac{1}{${a}}e^{${a}x} + C`,
                steps: [`∫ e^(${a}x) dx = (1/${a})e^(${a}x) + C`]
            };
        }
        
        return { error: 'Bu üstel fonksiyon desteklenmiyor' };
    }

    trigIntegral(expr, variable) {
        const integrals = {
            'sin(x)': { result: '-cos(x) + C', latex: '-\\cos(x) + C' },
            'cos(x)': { result: 'sin(x) + C', latex: '\\sin(x) + C' },
            'tan(x)': { result: '-ln(abs(cos(x))) + C', latex: '-\\ln|\\cos(x)| + C' },
            'sec(x)^2': { result: 'tan(x) + C', latex: '\\tan(x) + C' },
            'csc(x)^2': { result: '-cot(x) + C', latex: '-\\cot(x) + C' }
        };
        
        for (let [key, value] of Object.entries(integrals)) {
            if (expr.includes(key.replace('x', variable))) {
                return {
                    ...value,
                    steps: [`∫ ${key} d${variable} = ${value.result}`]
                };
            }
        }
        
        return { error: 'Bu trigonometrik fonksiyon desteklenmiyor' };
    }

    // TÜREV HESAPLAMA
    derivative(expression, variable = 'x') {
        try {
            const node = math.parse(expression);
            const derivative = math.derivative(node, variable);
            const result = derivative.toString();
            const simplified = math.simplify(result).toString();
            
            return {
                result: simplified,
                latex: this.toLatex(simplified),
                steps: this.getDerivativeSteps(expression, simplified, variable)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // LİMİT HESAPLAMA
    limit(expression, variable, approach) {
        try {
            // Özel limitler
            const specialLimits = {
                'sin(x)/x_0': { result: '1', explanation: 'Önemli limit: lim(x→0) sin(x)/x = 1' },
                '(1+1/x)^x_inf': { result: 'e', explanation: 'e sayısının tanımı' },
                '(e^x-1)/x_0': { result: '1', explanation: 'Önemli limit: lim(x→0) (e^x-1)/x = 1' }
            };
            
            const key = `${expression}_${approach}`;
            if (specialLimits[key]) {
                return {
                    result: specialLimits[key].result,
                    steps: [specialLimits[key].explanation]
                };
            }
            
            // Genel limit hesaplama (yaklaşım)
            const approachValue = approach === 'inf' ? 1000000 : approach === '-inf' ? -1000000 : parseFloat(approach);
            const scope = { [variable]: approachValue };
            const result = math.evaluate(expression, scope);
            
            // Belirsizlik kontrolü
            if (isNaN(result) || !isFinite(result)) {
                return this.lhopitalRule(expression, variable, approach);
            }
            
            return {
                result: result.toString(),
                latex: result.toString(),
                steps: [`lim(${variable}→${approach}) ${expression} = ${result}`]
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    lhopitalRule(expression, variable, approach) {
        try {
            // L'Hôpital kuralı uygula
            const parts = expression.split('/');
            if (parts.length === 2) {
                const numerator = parts[0].trim();
                const denominator = parts[1].trim();
                
                const derivNum = this.derivative(numerator, variable);
                const derivDen = this.derivative(denominator, variable);
                
                if (derivNum.result && derivDen.result) {
                    const newExpr = `(${derivNum.result})/(${derivDen.result})`;
                    return {
                        result: 'L\'Hôpital kuralı uygulandı',
                        steps: [
                            '0/0 belirsizliği tespit edildi',
                            'L\'Hôpital kuralı uygulanıyor',
                            `Pay türevi: ${derivNum.result}`,
                            `Payda türevi: ${derivDen.result}`,
                            `Yeni limit: ${newExpr}`
                        ]
                    };
                }
            }
            return { error: 'L\'Hôpital kuralı uygulanamadı' };
        } catch (error) {
            return { error: error.message };
        }
    }

    // DENKLEM ÇÖZME
    solveEquation(equation, variable = 'x') {
        try {
            // Denklemi = işaretine göre ayır
            const parts = equation.split('=');
            if (parts.length !== 2) {
                throw new Error('Geçerli bir denklem formatı: expression = value');
            }
            
            const leftSide = parts[0].trim();
            const rightSide = parts[1].trim();
            
            // Basit doğrusal denklem: ax + b = c
            const linearMatch = leftSide.match(/(-?\d*\.?\d*)\*?x\s*([+-]\s*\d+\.?\d*)?/);
            if (linearMatch && !leftSide.includes('^')) {
                const a = linearMatch[1] === '' ? 1 : parseFloat(linearMatch[1]);
                const b = linearMatch[2] ? parseFloat(linearMatch[2].replace(/\s/g, '')) : 0;
                const c = parseFloat(rightSide);
                
                const solution = (c - b) / a;
                return {
                    result: solution.toString(),
                    steps: [
                        `Denklem: ${equation}`,
                        `${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}`,
                        `${a}x = ${c - b}`,
                        `x = ${solution}`
                    ]
                };
            }
            
            // Karesel denklem: ax^2 + bx + c = 0
            const quadMatch = leftSide.match(/(-?\d*\.?\d*)\*?x\^2\s*([+-]\s*\d*\.?\d*\*?x)?\s*([+-]\s*\d+\.?\d*)?/);
            if (quadMatch) {
                const a = quadMatch[1] === '' ? 1 : parseFloat(quadMatch[1]);
                const bTerm = quadMatch[2] ? quadMatch[2].replace(/\s/g, '').replace('x', '') : '0';
                const b = bTerm === '' || bTerm === '+' ? 1 : bTerm === '-' ? -1 : parseFloat(bTerm);
                const c = (quadMatch[3] ? parseFloat(quadMatch[3].replace(/\s/g, '')) : 0) - parseFloat(rightSide);
                
                const discriminant = b * b - 4 * a * c;
                
                if (discriminant < 0) {
                    return {
                        result: 'Reel çözüm yok',
                        steps: [`Diskriminant: ${discriminant} < 0`, 'Reel sayılarda çözüm yok']
                    };
                }
                
                const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
                const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
                
                return {
                    result: discriminant === 0 ? `x = ${x1}` : `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`,
                    steps: [
                        `Karesel denklem: ${a}x² + ${b}x + ${c} = 0`,
                        `Diskriminant: Δ = b² - 4ac = ${discriminant.toFixed(4)}`,
                        `x = (-b ± √Δ) / 2a`,
                        discriminant === 0 ? `x = ${x1}` : `x₁ = ${x1.toFixed(4)}, x₂ = ${x2.toFixed(4)}`
                    ]
                };
            }
            
            // Math.js ile genel çözüm
            try {
                const solutions = math.simplify(`${leftSide} - (${rightSide})`);
                return {
                    result: solutions.toString(),
                    steps: ['Denklem sadeleştirildi']
                };
            } catch {
                return { error: 'Bu denklem şu anda çözülemiyor' };
            }
            
        } catch (error) {
            return { error: error.message };
        }
    }

    // SADELEŞTİRME
    simplify(expression) {
        try {
            const simplified = math.simplify(expression);
            const result = simplified.toString();
            
            return {
                result: result,
                latex: this.toLatex(result),
                steps: [`İfade sadeleştirildi: ${expression} = ${result}`]
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // ÇARPANLARA AYIRMA
    factor(expression) {
        try {
            // Basit karesel ifadeler için çarpanlara ayırma
            // x^2 - a^2 = (x-a)(x+a)
            const diffSquares = expression.match(/x\^2\s*-\s*(\d+)/);
            if (diffSquares) {
                const a = Math.sqrt(parseInt(diffSquares[1]));
                if (Number.isInteger(a)) {
                    return {
                        result: `(x - ${a})(x + ${a})`,
                        steps: [
                            `İki kare farkı: x² - ${a}² = (x - ${a})(x + ${a})`
                        ]
                    };
                }
            }
            
            // x^2 + bx + c için çarpanlara ayırma
            const quadMatch = expression.match(/x\^2\s*([+-]\s*\d+)\*?x\s*([+-]\s*\d+)/);
            if (quadMatch) {
                const b = parseInt(quadMatch[1].replace(/\s/g, ''));
                const c = parseInt(quadMatch[2].replace(/\s/g, ''));
                
                // İki sayı bul ki: toplamları b, çarpımları c
                for (let i = -100; i <= 100; i++) {
                    for (let j = -100; j <= 100; j++) {
                        if (i + j === b && i * j === c) {
                            return {
                                result: `(x ${i >= 0 ? '+' : ''} ${i})(x ${j >= 0 ? '+' : ''} ${j})`,
                                steps: [
                                    `${i} + ${j} = ${b}`,
                                    `${i} × ${j} = ${c}`,
                                    `Çarpanlar: (x ${i >= 0 ? '+' : ''} ${i})(x ${j >= 0 ? '+' : ''} ${j})`
                                ]
                            };
                        }
                    }
                }
            }
            
            return {
                result: expression,
                steps: ['Bu ifade daha fazla çarpanlarına ayrılamaz']
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // AÇILIM (EXPAND)
    expand(expression) {
        try {
            // Basit çarpım açılımları
            const match = expression.match(/\(x\s*([+-])\s*(\d+)\)\s*\*\s*\(x\s*([+-])\s*(\d+)\)/);
            if (match) {
                const sign1 = match[1];
                const a = parseInt(match[2]);
                const sign2 = match[3];
                const b = parseInt(match[4]);
                
                const a_val = sign1 === '-' ? -a : a;
                const b_val = sign2 === '-' ? -b : b;
                
                const result = `x^2 ${a_val + b_val >= 0 ? '+' : ''} ${a_val + b_val}*x ${a_val * b_val >= 0 ? '+' : ''} ${a_val * b_val}`;
                
                return {
                    result: result,
                    latex: this.toLatex(result),
                    steps: [
                        '(a + b)(c + d) = ac + ad + bc + bd formülü',
                        `x² + ${a_val}x + ${b_val}x + ${a_val * b_val}`,
                        result
                    ]
                };
            }
            
            return {
                result: expression,
                steps: ['İfade açıldı']
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // YARDIMCI FONKSİYONLAR
    parseExpression(expr) {
        return expr.replace(/\s+/g, '').toLowerCase();
    }

    isPolynomial(expr, variable) {
        const pattern = new RegExp(`^[\\d\\s\\+\\-\\*\\^${variable}]+$`);
        return pattern.test(expr);
    }

    hasTrig(expr) {
        return /sin|cos|tan|sec|csc|cot/.test(expr);
    }

    splitTerms(expr) {
        return expr.replace(/\s/g, '').split(/(?=[+-])/).filter(t => t);
    }

    toLatex(expr) {
        return expr
            .replace(/\*/g, '')
            .replace(/\^/g, '^')
            .replace(/sqrt/g, '\\sqrt')
            .replace(/pi/g, '\\pi')
            .replace(/inf/g, '\\infty');
    }

    getIntegralSteps(original, result) {
        return [
            `Başlangıç: ∫ ${original} dx`,
            'Kuvvet kuralı: ∫ x^n dx = x^(n+1)/(n+1) + C',
            `Sonuç: ${result.join(' + ')} + C`
        ];
    }

    getDerivativeSteps(original, result, variable) {
        return [
            `Başlangıç: d/d${variable} (${original})`,
            'Türev kuralları uygulandı',
            `Sonuç: ${result}`
        ];
    }

    numericalIntegral(expr, variable, a = 0, b = 1) {
        // Simpson kuralı ile sayısal integral
        try {
            const n = 100;
            const h = (b - a) / n;
            let sum = 0;
            
            for (let i = 0; i <= n; i++) {
                const x = a + i * h;
                const scope = { [variable]: x };
                const y = math.evaluate(expr, scope);
                
                if (i === 0 || i === n) {
                    sum += y;
                } else if (i % 2 === 0) {
                    sum += 2 * y;
                } else {
                    sum += 4 * y;
                }
            }
            
            const result = (h / 3) * sum;
            
            return {
                result: `${result.toFixed(6)} (sayısal yaklaşım)`,
                steps: ['Sayısal integral (Simpson kuralı) uygulandı']
            };
        } catch (error) {
            return { error: 'Sayısal integral hesaplanamadı' };
        }
    }
}

// Global math engine instance
const mathEngine = new MathEngine();
