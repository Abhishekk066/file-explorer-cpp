#include <iostream>
using namespace std;

class Factorial {
public:
    int fact = 1;
    void calculate(int num) {
        for(int i = num; i > 0; i--){
            fact *= i;
        }
        cout << "Factorial of " << num << " is " << fact << endl;
    }
};

class Fibonacci {
public:
    int t1, t2 = 0, t3 = 1;

    void calculate(int num) {
        cout << "Fibonacci series of " << num << "th term is " << endl;
        for(int i = 0; i < num; i++){
            t1 = t2 + t3;
            t2 = t3;
            t3 = t1;
            cout << t3 << " ";
        }
    }
};

int main() {
    int num;
    cout << "Enter Number: ";
    cin >> num;

    Factorial fact;
    fact.calculate(num);

    Fibonacci fibo;
    fibo.calculate(num);
    return 0;
}
